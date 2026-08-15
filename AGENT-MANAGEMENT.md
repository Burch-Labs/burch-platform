# 🤖 Agent Management System - Burch Platform

This document describes how AI agents manage the Burch Platform website (index.html) deployment.

---

## 📋 Agent Roles

### **CEO Agent** (Orchestrator)
- **Role**: Coordinates all agents for platform updates
- **Mandate**: Oversee index.html updates, approve changes, ensure consistency
- **Access**: Full visibility to all agent activities
- **Command**: "CEO, coordinate an update to the landing page"

### **Developer Agent** (Technical Lead)
- **Role**: Handles technical updates to index.html
- **Mandate**: Update code, fix issues, manage GitHub commits
- **Commands**:
  - "Developer, update the hero section in index.html"
  - "Developer, add a new section to the index"
  - "Developer, commit and push changes"

### **Marketing Agent** (Content Creator)
- **Role**: Updates marketing copy and messaging
- **Mandate**: Update text, descriptions, call-to-action buttons
- **Commands**:
  - "Marketing, update the homepage copy"
  - "Marketing, refresh our messaging on the hero section"
  - "Marketing, create new section descriptions"

### **Analytics Agent** (Monitor)
- **Role**: Monitors deployment health
- **Mandate**: Verify site is live, check deployment status
- **Command**: "Analytics, check if the website is live and working"

---

## 🔄 Workflow: How Agents Manage Updates

### **Step 1: Request Update**
```
User → CEO Agent: "Update the landing page with new events messaging"
```

### **Step 2: CEO Coordinates**
CEO Agent breaks down the request:
- **Marketing Agent**: "Update the copy and descriptions"
- **Developer Agent**: "Implement the changes in index.html"

### **Step 3: Agents Execute**

#### Marketing Agent:
1. Draft new copy/messaging
2. Send to Developer Agent

#### Developer Agent:
1. Edit `/apps/web/public/index.html`
2. Make changes based on Marketing's content
3. Test changes locally (if possible)
4. Commit: `git add apps/web/public/index.html`
5. Commit message: `git commit -m "Update: [description]"`
6. Push: `git push origin claude/burch-platform-q4nf5k`

### **Step 4: Automatic Deployment**
- GitHub Action triggers automatically
- Deploys to Hostgator FTP
- Changes live on `http://unduguhalisinetwork.com` in 30-60 seconds

### **Step 5: Analytics Verifies**
- Analytics Agent checks if site is live
- Reports status back to CEO

---

## 📁 File Structure for Agents

```
/home/user/burch-platform/
├── apps/web/public/
│   └── index.html              ← AGENTS EDIT THIS
├── .github/workflows/
│   └── deploy-to-hostgator.yml ← AUTO DEPLOYS
├── AGENT-MANAGEMENT.md         ← THIS FILE
└── .agents/
    └── memory/                 ← Agent memory/history
```

---

## 🛠️ Common Agent Commands

### **To Update Website**
```
CEO: "Coordinate a landing page update: [specific request]"
```

### **To Update Specific Section**
```
Marketing: "Update the 'Why Choose Us' section with new benefits"
Developer: "Implement the marketing changes in index.html"
```

### **To Add New Section**
```
CEO: "Add a new testimonials section to the landing page"
Marketing: "Draft testimonial content and structure"
Developer: "Implement the new section in index.html"
```

### **To Check Deployment Status**
```
Analytics: "Verify the website is live and check deployment status"
```

---

## 🔐 Security & Rules for Agents

1. **Only edit index.html** - No other files should be modified
2. **Use meaningful commit messages** - Describe what changed
3. **Push to `claude/burch-platform-q4nf5k`** - Never push to main
4. **GitHub Actions handles deployment** - Agents don't need to deploy manually
5. **Get CEO approval** - For major changes, consult CEO Agent first

---

## 📝 Example Workflow

### **Scenario: Marketing wants to update hero section**

```
User: "Marketing, update the hero headline to focus on premium experiences"

Marketing Agent:
- Analyzes current hero section
- Drafts new headline: "Unforgettable Moments Await"
- Drafts supporting text
- Sends to Developer Agent

Developer Agent:
- Opens index.html
- Updates <h1> text
- Updates <p> description
- Reviews changes
- Commits: git commit -m "Update: Hero section messaging for premium positioning"
- Pushes: git push origin claude/burch-platform-q4nf5k

GitHub Action:
- Detects push
- Runs: Deploy to Hostgator
- Completes in 30-60 seconds

Analytics Agent:
- Checks: curl http://unduguhalisinetwork.com
- Confirms: "Website is live with updated hero section"

CEO Agent:
- Reports: "Update complete and verified live"
```

---

## 🚀 Quick Reference: Agent Commands

| Agent | Command | Action |
|-------|---------|--------|
| **CEO** | "Review and approve index update" | Oversees changes |
| **Marketing** | "Draft new homepage copy" | Creates content |
| **Developer** | "Update index.html and deploy" | Implements & commits |
| **Analytics** | "Verify website is live" | Monitors deployment |

---

## 📞 Support

For agent-related issues:
1. Check `.agents/memory/` for agent history
2. Review last commits: `git log --oneline -10`
3. Check GitHub Actions: https://github.com/Burch-Labs/burch-platform/actions

---

**Last Updated**: August 15, 2026
**Status**: ✅ Ready for Agent Management
