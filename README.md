# NexaFlow Frontend

Vue 3 企业协同工作台，提供客户管理、需求分析、报价、任务与交付提醒能力。

## Stack

- Vue 3
- TypeScript
- Vite
- Element Plus
- Pinia
- Vue Router
- Axios

## Development

```bash
pnpm install
pnpm dev
```

默认代理后端网关：

```text
http://192.168.2.128:18080/api
```

演示账号：

```text
admin / admin123
```

## Build

```bash
pnpm build
```

默认构建使用本地依赖，保证内网、受限网络和 CDN 故障时仍可使用。已提供可选 CDN 加速构建：设置 `VITE_USE_CDN=true` 后，Vue、Element Plus、Pinia、Axios、ECharts 与图标库将由 jsDelivr 加载。建议仅在部署环境已验证 CDN 可达、并具备外网可用性监控时启用。
