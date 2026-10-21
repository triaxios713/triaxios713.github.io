---
layout: default
title: Projects
permalink: /projects.html
---

# Projects

Here is the primary project I have developed:

---

## **Aegis – Disaster Alert System for Telecom Stations**  
*June 2026 – July 2026 | Personal Project*

A full-stack system that warns operators 1–7 days ahead when rain, storms or floods threaten 10,000 telecom stations, and ranks which sites need help first.

- **Risk Engine**: Combined weather forecasts and UN disaster alerts with map-based (PostGIS) queries to score each station's risk (0–100) and open SEV1–SEV4 incidents that escalate automatically if not handled in time.
- **Reliability & Performance**: Delivered alerts to Telegram and a live dashboard via a message queue with retries; served map data under 12ms with Redis and load-tested at 2,150 req/s with 0% errors.
- **Key Technologies**: Java, Spring Boot, PostgreSQL/PostGIS, Redis, ActiveMQ, Next.js.
- **Links**: [Backend Code](https://github.com/triaxios713/AegisServer) &nbsp;•&nbsp; [Frontend Code](https://github.com/triaxios713/Aegis)
