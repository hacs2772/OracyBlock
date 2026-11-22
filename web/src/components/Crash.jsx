// 화면이 멈췄을 때 (concept 11-26): 하얀 화면 대신 "다시 열기". 오류는 저절로 관리자에게 보내요
import { Component } from 'react';
import { reportError } from '../lib/errors.js';

export default class Crash extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err, info) {
    // 새 판을 올린 직후, 예전 화면이 없어진 파일을 찾으면 한 번만 저절로 새로 열어요
    if (/dynamically imported module|Importing a module script failed|error loading dynamically/i.test(String(err?.message || err))) {
      try {
        if (!sessionStorage.getItem('oracy.reloaded')) {
          sessionStorage.setItem('oracy.reloaded', '1');
          location.reload();
          return;
        }
      } catch {
        /* 못 하면 아래처럼 "다시 열기" */
      }
    }
    const e = err instanceof Error ? err : new Error(String(err));
    if (info?.componentStack) e.stack = `${e.stack || ''}\n--- 화면 ---${info.componentStack}`.slice(0, 4000);
    reportError(e, 'crash');
  }

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="app">
        <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
          <h1 style={{ fontSize: 26 }}>앗, 화면이 멈췄어요</h1>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, marginTop: 8 }}>
            쌓은 탑과 단어는 그대로 있어요.<br />어디서 멈췄는지는 저절로 알려졌어요.
          </p>
          <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
            <button className="ob-btn coral wide" onClick={() => location.reload()}><span className="t">다시 열기</span></button>
            <button className="ob-btn wide" onClick={() => { location.href = '/'; }}><span className="t">홈으로</span></button>
          </div>
        </div>
      </div>
    );
  }
}
