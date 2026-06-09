#!/bin/bash
# TinkerWithTech Ep14: OpenCost Setup
set -e

setup() {
  echo "--- Creating k3d cluster ---"
  k3d cluster create opencost-demo --wait

  echo "--- Installing Prometheus ---"
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm repo update
  helm upgrade --install prometheus prometheus-community/prometheus \
    --namespace prometheus-system --create-namespace \
    --set alertmanager.enabled=false \
    --set pushgateway.enabled=false \
    --set server.persistentVolume.enabled=false
  
  kubectl wait --for=condition=Available deployment --all -n prometheus-system --timeout=300s

  echo "--- Installing OpenCost ---"
  helm repo add opencost https://opencost.github.io/opencost-helm-chart
  helm repo update
  helm upgrade --install opencost opencost/opencost \
    --namespace opencost --create-namespace \
    --set opencost.prometheus.internal.enabled=false \
    --set opencost.prometheus.external.enabled=true \
    --set opencost.prometheus.external.url=http://prometheus-server.prometheus-system.svc.cluster.local \
    --set opencost.ui.enabled=true
  
  kubectl wait --for=condition=Available deployment --all -n opencost --timeout=300s
}

verify() {
  echo "--- Deploying leaky workload ---"
  kubectl apply -f https://tinkerwithtech.com/downloads/ep14-leaky-app.yaml
  
  echo "--- Waiting for metrics (3 mins) ---"
  sleep 180
}

demo_payoff() {
  echo "--- HERO MOMENT ---"
  kubectl cost namespace --opencost
}

teardown() {
  k3d cluster delete opencost-demo
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  setup
  verify
  demo_payoff
fi
