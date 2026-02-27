"use client";

import React, { useState } from "react";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-go";
import "prismjs/components/prism-hcl";
import "prismjs/themes/prism-tomorrow.css"; // We'll override colors in CSS

interface CodeBlockProps {
    children: React.ReactNode;
    className?: string;
}

// Box-drawing and arrow characters that indicate ASCII architecture diagrams
const DIAGRAM_CHARS = /[┌┐└┘├┤┬┴┼─│╔╗╚╝╠╣╦╩╬═║▼▶←→↑↓◀▸■□►◄▲●○◆]/;

function isDiagram(code: string, language: string): boolean {
    // Only treat unlabeled or explicit "text" blocks as potential diagrams
    if (language && language !== "text") return false;
    return DIAGRAM_CHARS.test(code);
}

export function CodeBlock({ children, className }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);

    // MDX passes className as `language-<lang>` on the <code> child
    let extractedClassName = className || "";
    if (!extractedClassName && React.isValidElement(children) && children.props) {
        extractedClassName = (children.props as any).className || "";
    }

    const languageMatch = /language-(\w+)/.exec(extractedClassName);
    const language = languageMatch ? languageMatch[1] : "";
    const isTerminal = ["bash", "sh", "shell"].includes(language);

    // Extract string content
    const extractText = (node: any): string => {
        if (typeof node === "string") return node;
        if (Array.isArray(node)) return node.map(extractText).join("");
        if (node && node.props && node.props.children) return extractText(node.props.children);
        return "";
    };

    const codeString = extractText(children).trim();

    // ── Diagram rendering path ──────────────────────────────────────────────
    // ASCII architecture diagrams get a clean, borderless pre block — no
    // terminal chrome, no copy button, just readable monospace art.
    if (isDiagram(codeString, language)) {
        return (
            <figure className="my-8 rounded-xl border border-foreground/10 bg-foreground/[0.025] overflow-x-auto not-prose">
                <pre className="p-6 m-0 font-mono text-sm text-foreground/60 leading-snug whitespace-pre">
                    {codeString}
                </pre>
            </figure>
        );
    }

    // ── Code block rendering path ───────────────────────────────────────────
    const handleCopy = async () => {
        await navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    let htmlResult = codeString;
    try {
        if (language && languages[language]) {
            htmlResult = highlight(codeString, languages[language], language);
        }
    } catch {
        // fallback to plain text if parsing fails
    }

    return (
        <div className="relative my-6 group rounded-xl overflow-hidden border border-foreground/10 bg-[#1a1820]">
            {isTerminal ? (
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#201e2b] border-b border-white/5">
                    <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <span className="text-xs text-foreground/30 font-mono select-none">bash</span>
                </div>
            ) : language ? (
                <div className="px-4 py-2 bg-[#201e2b] border-b border-white/5 flex items-center">
                    <span className="text-xs text-foreground/30 font-mono select-none uppercase tracking-widest">{language}</span>
                </div>
            ) : null}

            <button
                onClick={handleCopy}
                className="absolute top-2.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground/10 hover:bg-foreground/20 text-foreground/50 hover:text-foreground/80 text-xs px-2.5 py-1 rounded border border-foreground/10 font-mono"
                aria-label="Copy code"
            >
                {copied ? "✓ copied" : "copy"}
            </button>

            <div className="p-5 overflow-x-auto">
                <pre className={`language-${language} m-0 p-0 bg-transparent text-sm leading-relaxed`}>
                    <code
                        className="font-mono text-[#cdd6f4]"
                        dangerouslySetInnerHTML={{ __html: htmlResult }}
                    />
                </pre>
            </div>
        </div>
    );
}
