import { Component, type PropsWithChildren } from "react";
import Notice from "./components/Notice";

export default class ErrorBoundary extends Component<PropsWithChildren, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? <Notice /> : this.props.children;
  }
}
