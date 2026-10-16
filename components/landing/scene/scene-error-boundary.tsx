"use client";

import React, { Component, ReactNode, ErrorInfo } from "react";
import { AmbientScene } from "../ambient-scene";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class SceneErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("WebGL 3D Hero Scene fallback engaged:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <AmbientScene />;
    }
    return this.props.children;
  }
}
