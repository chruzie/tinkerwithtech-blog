#!/bin/bash
#
# Argo CD Agent Homelab Setup Script
# Episode 1: Multi-Cluster GitOps Without the Pain
# 
# Usage: ./ep01-setup.sh [command]
#   ./ep01-setup.sh setup     - Full setup (default)
#   ./ep01-setup.sh teardown  - Clean up everything
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prereqs() {
    log_info "Checking prerequisites..."
    
    local tools=("k3d" "vcluster" "kubectl" "helm" "argocd" "argocd-agentctl" "docker")
    local missing=()
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing+=("$tool")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing[*]}"
        echo ""
        echo "Install argocd-agentctl:"
        echo "  # Apple Silicon:"
        echo "  curl -Lo argocd-agentctl https://github.com/argoproj-labs/argocd-agent/releases/download/v0.5.3/argocd-agentctl-darwin-arm64"
        echo ""
        echo "  # Intel:"
        echo "  curl -Lo argocd-agentctl https://github.com/argoproj-labs/argocd-agent/releases/download/v0.5.3/argocd-agentctl-darwin-amd64"
        echo ""
        echo "  chmod +x argocd-agentctl && sudo mv argocd-agentctl /usr/local/bin/"
        exit 1
    fi
    
    log_success "All prerequisites found"
}

# Step 1: Create Hub Cluster
setup_hub() {
    log_info "Step 1: Creating Hub Cluster..."
    
    k3d cluster create hub \
        --port "8080:80@loadbalancer" \
        --port "8443:443@loadbalancer" \
        --agents 1 \
        --wait
    
    kubectl config use-context k3d-hub
    log_success "Hub cluster created"
}

# Step 2: Create Workload Clusters
setup_workloads() {
    log_info "Step 2: Creating Workload Clusters..."
    
    # Create workload-1
    vcluster create workload-1 \
        --namespace vcluster-workload-1 \
        --context k3d-hub \
        --connect=false
    
    # Create workload-2
    vcluster create workload-2 \
        --namespace vcluster-workload-2 \
        --context k3d-hub \
        --connect=false
    
    # Export kubeconfig for each vCluster
    vcluster connect workload-1 \
        -n vcluster-workload-1 \
        --context k3d-hub \
        --print > /tmp/vc-workload-1.yaml
    
    vcluster connect workload-2 \
        -n vcluster-workload-2 \
        --context k3d-hub \
        --print > /tmp/vc-workload-2.yaml
    
    # Merge all
    export KUBECONFIG="${HOME}/.kube/config:/tmp/vc-workload-1.yaml:/tmp/vc-workload-2.yaml"
    kubectl config view --flatten > /tmp/merged.yaml
    mv /tmp/merged.yaml "${HOME}/.kube/config"
    unset KUBECONFIG
    
    # Rename contexts
    kubectl config rename-context \
        "vcluster_workload-1_vcluster-workload-1_k3d-hub" \
        "vcluster-workload-1" 2>/dev/null || true
    kubectl config rename-context \
        "vcluster_workload-2_vcluster-workload-2_k3d-hub" \
        "vcluster-workload-2" 2>/dev/null || true
    
    log_success "Workload clusters created"
}

# Step 3: Install Argo CD on Hub
setup_argocd_hub() {
    log_info "Step 3: Installing Argo CD on Hub..."
    
    kubectl create namespace argocd --context k3d-hub 2>/dev/null || true
    
    kubectl apply -n argocd \
        -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml \
        --context k3d-hub \
        --server-side --force-conflicts
    
    kubectl rollout status deployment/argocd-server \
        -n argocd --context k3d-hub --timeout=300s
    
    # Scale app-controller to 0 on hub
    kubectl scale statefulset argocd-application-controller \
        -n argocd --replicas=0 --context k3d-hub
    
    # Save admin password
    ARGOCD_PASS=$(kubectl get secret argocd-initial-admin-secret \
        -n argocd --context k3d-hub \
        -o jsonpath="{.data.password}" | base64 -d)
    echo "${ARGOCD_PASS}" > /tmp/argocd-admin-password.txt
    
    log_success "Argo CD installed on hub"
    log_info "Admin password: ${ARGOCD_PASS}"
}

# Step 4: Bootstrap PKI
setup_pki() {
    log_info "Step 4: Bootstrapping PKI..."
    
    # Initialize CA
    argocd-agentctl pki init \
        --principal-context k3d-hub \
        --principal-namespace argocd
    
    # Install principal
    kubectl apply -n argocd \
        -k "https://github.com/argoproj-labs/argocd-agent/install/kubernetes/principal?ref=main" \
        --context k3d-hub
    
    # Get IPs for cert SANs
    PRINCIPAL_IP=$(kubectl get svc argocd-agent-principal \
        -n argocd --context k3d-hub \
        -o jsonpath='{.spec.clusterIP}')
    NODE_IP=$(kubectl get nodes --context k3d-hub \
        -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
    
    # Issue principal TLS cert
    argocd-agentctl pki issue principal \
        --principal-context k3d-hub \
        --ip "${PRINCIPAL_IP}" \
        --ip "${NODE_IP}" \
        --dns "argocd-agent-principal.argocd.svc.cluster.local" \
        --upsert
    
    # Issue resource-proxy cert
    argocd-agentctl pki issue resource-proxy \
        --principal-context k3d-hub \
        --dns "argocd-agent-resource-proxy.argocd.svc.cluster.local" \
        --upsert
    
    # Create JWT signing key
    argocd-agentctl jwt create-key \
        --principal-context k3d-hub \
        --principal-namespace argocd \
        --upsert
    
    # Wait for principal
    kubectl rollout status deployment/argocd-agent-principal \
        -n argocd --context k3d-hub --timeout=300s
    
    # Restart with certs
    kubectl rollout restart deployment/argocd-agent-principal \
        -n argocd --context k3d-hub
    
    kubectl rollout status deployment/argocd-agent-principal \
        -n argocd --context k3d-hub --timeout=300s
    
    log_success "PKI bootstrapped"
}

# Step 4.5: Configure Principal
configure_principal() {
    log_info "Step 4.5: Configuring Principal..."
    
    # Patch Redis NetworkPolicy for principal access
    kubectl patch networkpolicy argocd-redis-network-policy \
        -n argocd --context k3d-hub \
        --type=json \
        -p='[{"op":"add","path":"/spec/ingress/0/from/-","value":{"podSelector":{"matchLabels":{"app.kubernetes.io/name":"argocd-agent-principal"}}}}]' 2>/dev/null || true
    
    # Pin principal to same node as Redis
    REDIS_NODE=$(kubectl get pod -n argocd -l "app.kubernetes.io/name=argocd-redis" \
        --context k3d-hub -o jsonpath='{.items[0].spec.nodeName}')
    kubectl patch deployment argocd-agent-principal -n argocd --context k3d-hub \
        -p="{\"spec\":{\"template\":{\"spec\":{\"nodeSelector\":{\"kubernetes.io/hostname\":\"${REDIS_NODE}\"}}}}}"
    
    # Enable namespace routing
    kubectl patch configmap argocd-agent-params \
        -n argocd --context k3d-hub \
        --type=merge \
        -p='{"data":{"principal.allowed-namespaces":"workload-1,workload-2"}}'
    
    # Restart with config
    kubectl rollout restart deployment/argocd-agent-principal -n argocd --context k3d-hub
    kubectl rollout status deployment/argocd-agent-principal \
        -n argocd --context k3d-hub --timeout=300s
    
    log_success "Principal configured"
}

# Step 5: Register Agents
register_agents() {
    log_info "Step 5: Registering Agents..."
    
    # Pre-create argocd namespace on workloads
    for agent in workload-1 workload-2; do
        kubectl create namespace argocd --context "vcluster-${agent}" 2>/dev/null || true
    done
    
    for agent in workload-1 workload-2; do
        # Register agent
        argocd-agentctl agent create "${agent}" \
            --principal-context k3d-hub \
            --principal-namespace argocd \
            --resource-proxy-server "argocd-agent-resource-proxy.argocd.svc.cluster.local:9090"
        
        # Issue mTLS client cert
        argocd-agentctl pki issue agent "${agent}" \
            --principal-context k3d-hub \
            --agent-context "vcluster-${agent}" \
            --agent-namespace argocd \
            --upsert
        
        # Propagate CA cert
        argocd-agentctl pki propagate \
            --principal-context k3d-hub \
            --principal-namespace argocd \
            --agent-context "vcluster-${agent}" \
            --agent-namespace argocd
    done
    
    log_success "Agents registered"
}

# Step 5.5: Create Cluster Secrets
setup_cluster_secrets() {
    log_info "Step 5.5: Creating Cluster Secrets..."
    
    PROXY_ADDR="argocd-agent-resource-proxy.argocd.svc.cluster.local"
    
    for agent in workload-1 workload-2; do
        kubectl apply -n argocd --context k3d-hub -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: cluster-${agent}
  namespace: argocd
  labels:
    argocd.argoproj.io/secret-type: cluster
    argocd-agent.argoproj-labs.io/agent-name: ${agent}
stringData:
  name: "${agent}"
  server: "https://${PROXY_ADDR}:9090?agentName=${agent}"
  config: '{"tlsClientConfig":{"insecure":true}}'
type: Opaque
EOF
    done
    
    log_success "Cluster secrets created"
}

# Step 6: Deploy Agents on Workloads
setup_agents() {
    log_info "Step 6: Deploying Agents on Workloads..."
    
    # Get node IP + NodePort for principal
    PRINCIPAL_NODE_IP=$(kubectl get nodes --context k3d-hub \
        -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
    PRINCIPAL_NODE_PORT=$(kubectl get svc argocd-agent-principal \
        -n argocd --context k3d-hub \
        -o jsonpath='{.spec.ports[0].nodePort}')
    
    log_info "Principal reachable at: ${PRINCIPAL_NODE_IP}:${PRINCIPAL_NODE_PORT}"
    
    for ctx in vcluster-workload-1 vcluster-workload-2; do
        kubectl create namespace argocd --context "${ctx}" 2>/dev/null || true
        
        # Install Argo CD (for application-controller)
        kubectl apply -n argocd \
            -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml \
            --context "${ctx}" \
            --server-side --force-conflicts
        
        kubectl rollout status statefulset/argocd-application-controller \
            -n argocd --context "${ctx}" --timeout=300s
        
        # Scale down non-essentials
        for d in argocd-server argocd-applicationset-controller \
                    argocd-notifications-controller argocd-dex-server; do
            kubectl scale deployment "${d}" \
                -n argocd --replicas=0 --context "${ctx}" 2>/dev/null || true
        done
        
        # Install agent
        kubectl apply -n argocd \
            -k "https://github.com/argoproj-labs/argocd-agent/install/kubernetes/agent?ref=main" \
            --context "${ctx}"
        
        # Configure: use node IP + NodePort
        kubectl patch configmap argocd-agent-params \
            -n argocd --context "${ctx}" \
            --patch "{
              \"data\": {
                \"agent.server.address\": \"${PRINCIPAL_NODE_IP}\",
                \"agent.server.port\": \"${PRINCIPAL_NODE_PORT}\",
                \"agent.mode\": \"managed\",
                \"agent.creds\": \"mtls:^CN=(.+)$\",
                \"agent.tls.secret-name\": \"argocd-agent-client-tls\",
                \"agent.tls.client.insecure\": \"false\"
              }
            }"
        
        kubectl rollout restart deployment/argocd-agent-agent \
            -n argocd --context "${ctx}"
        
        kubectl rollout status deployment/argocd-agent-agent \
            -n argocd --context "${ctx}" --timeout=300s
    done
    
    # Create routing namespaces on hub
    kubectl create namespace workload-1 --context k3d-hub 2>/dev/null || true
    kubectl create namespace workload-2 --context k3d-hub 2>/dev/null || true
    
    log_success "Agents deployed on workloads"
}

# Step 7: Port forward Argo CD UI
setup_ui() {
    log_info "Step 7: Setting up Argo CD UI access..."
    
    kubectl port-forward svc/argocd-server \
        -n argocd 8443:443 \
        --context k3d-hub \
        &>/tmp/argocd-port-forward.log &
    
    sleep 2
    
    log_success "Argo CD UI configured"
    echo ""
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}Argo CD UI: https://localhost:8443${NC}"
    echo -e "${GREEN}Login: admin / $(cat /tmp/argocd-admin-password.txt)${NC}"
    echo -e "${GREEN}======================================${NC}"
    echo ""
    log_warn "Certificate warning is expected (self-signed)"
}

# Teardown function
teardown() {
    log_info "Tearing down infrastructure..."
    
    # Delete vClusters
    vcluster delete workload-1 -n vcluster-workload-1 --context k3d-hub 2>/dev/null || true
    vcluster delete workload-2 -n vcluster-workload-2 --context k3d-hub 2>/dev/null || true
    
    # Remove proxy containers
    docker rm -f vcluster_workload-1_vcluster-workload-1_k3d-hub_background_proxy 2>/dev/null || true
    docker rm -f vcluster_workload-2_vcluster-workload-2_k3d-hub_background_proxy 2>/dev/null || true
    
    # Delete k3d cluster
    k3d cluster delete hub 2>/dev/null || true
    
    # Clean contexts
    kubectl config delete-context vcluster-workload-1 2>/dev/null || true
    kubectl config delete-context vcluster-workload-2 2>/dev/null || true
    kubectl config delete-context k3d-hub 2>/dev/null || true
    
    # Kill port-forward
    pkill -f "port-forward.*argocd-server" 2>/dev/null || true
    
    # Clean temp files
    rm -f /tmp/argocd-admin-password.txt /tmp/argocd-port-forward.log /tmp/vc-*.yaml
    
    log_success "Cleanup complete!"
}

# Main setup flow
run_setup() {
    check_prereqs
    setup_hub
    setup_workloads
    setup_argocd_hub
    setup_pki
    configure_principal
    register_agents
    setup_cluster_secrets
    setup_agents
    setup_ui
    
    echo ""
    log_success "Setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Open https://localhost:8443 in your browser"
    echo "  2. Login with admin / $(cat /tmp/argocd-admin-password.txt)"
    echo "  3. Deploy a test app:"
    echo "     kubectl apply -f manifests/demo-app.yaml --context k3d-hub"
    echo ""
    echo "To tear down everything:"
    echo "  ./ep01-setup.sh teardown"
}

# Main
main() {
    case "${1:-setup}" in
        setup)
            run_setup
            ;;
        teardown)
            teardown
            ;;
        *)
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  setup     - Run full setup (default)"
            echo "  teardown  - Clean up all infrastructure"
            exit 1
            ;;
    esac
}

main "$@"
