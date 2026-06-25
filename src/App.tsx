import { BracketTree } from './components/BracketTree'
import { DataSourceBar } from './components/DataSourceBar'
import { MainGrid } from './components/MainGrid'
import './App.css'

function App() {
  return (
    <div className="app">
        <header className="hero">
          <h1>2026 世界杯 Bracket 模拟器</h1>
          <p>小组排名 → 最佳第三名 → 自动生成 32 强对阵树</p>
        </header>
        <DataSourceBar />
        <MainGrid />
        <BracketTree />
    </div>
  )
}

export default App
