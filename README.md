# 2026 世界杯 Bracket 模拟器

小组排名 → 最佳第三名 → 自动生成 FIFA 2026 Round of 32 对阵树。

## 功能

- 12 组 A–L 积分榜，组内拖拽调整排名
- 12 支第三名横向排名，前 8 出线（Article 13 规则）
- Annex C 495 组合查表，自动填充 8 个第三名 R32 槽位
- API-Football 实时同步（可选）+ 手动覆盖锁定

## 开发

```bash
cd world-cup-bracket
npm install
cp .env.example .env   # 填入 VITE_API_FOOTBALL_KEY
npm run dev
```

## 测试

```bash
npm test
npm run build
```

## 规则来源

FIFA World Cup 26 Regulations — Article 12.6 (R32 对阵), Article 13 (同分/第三名), Annex C (495 组合表)
