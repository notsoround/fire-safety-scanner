# 🔥 Fire Safety Scanner

**A lead generation and client retention engine for Pye Barker field technicians, powered by AI.**

This project is a web and mobile application designed to make fire extinguisher inspections fast, simple, and valuable. It empowers technicians in the field to capture data effortlessly, ensuring client compliance and uncovering new business opportunities.

---

## 🧭 Core Vision & Strategy

The primary goal is to transform the routine task of inspection into a strategic business activity.

1.  **Client Retention:** By creating an automated system to track inspection due dates, we ensure no existing client's compliance lapses. This secures recurring revenue and strengthens client relationships.
2.  **Lead Generation:** By making it effortless for technicians to log competitor extinguishers, we build a proprietary database of future sales leads, turning every site visit into a potential opportunity.
3.  **Technician Empowerment:** The application is designed for the technician first. The workflow must be incredibly fast and simple: **See Tag -> Snap Picture -> AI Analyzes -> Verify -> Submit.**

---

## 📂 Project Documentation & Specifications

This project follows a spec-driven development approach. The "truth" of the project is defined in the following documents, not just in the code.

| File Path                               | Description                                                                              |
| :-------------------------------------- | :--------------------------------------------------------------------------------------- |
| **`README.md`**                         | **(This File)** The high-level vision, strategy, and table of contents for the project.  |
| [`DEPLOYMENT.md`](./DEPLOYMENT.md)      | **Single Source of Truth** for all deployment, operations, and troubleshooting procedures. |
| [`specs/ARCHITECTURE.md`](./specs/ARCHITECTURE.md) | The high-level system architecture diagrams and project file structure.                  |
| [`specs/API_REFERENCE.md`](./specs/API_REFERENCE.md)  | Detailed specifications for the database schema and all API endpoints.                   |
| [`specs/AI_MODEL.md`](./specs/AI_MODEL.md)          | *(Planned)* Requirements, prompts, and success criteria for the AI analysis model.      |
| [`specs/CORE_FEATURES.md`](./specs/CORE_FEATURES.md)    | *(Planned)* Detailed breakdown of user-facing features and workflows.                   |

---

## 🚀 Quick Start (Local Development)

This guide is for running the application on a local development machine. For server deployment, see [`DEPLOYMENT.md`](./DEPLOYMENT.md).

### 1. **Configure Environment**

```bash
# Copy the environment variable template
cp .env.example .env

# Edit the .env file with your local settings and API keys
# (e.g., MongoDB connection string, OpenRouter key)
nano .env