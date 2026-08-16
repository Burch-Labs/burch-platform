# Deploy on Reply

This document explains the "Deploy on Reply" feature, which allows automatic deployments triggered by comments on GitHub pull requests and issues.

## Overview

The `deploy-on-reply.yml` GitHub Actions workflow enables deployments to be triggered by replying to a PR or issue with a specific command. This is useful for:

- Testing changes in a staging environment before merging
- Quick deployments without going through the normal CI/CD pipeline
- Giving reviewers the ability to deploy changes for testing

## How to Use

### Triggering a Deployment

To trigger a deployment via a comment on a GitHub PR or issue:

1. Open the relevant pull request or issue
2. Leave a comment containing `/deploy`
3. The GitHub Actions workflow will automatically:
   - Checkout the code
   - Install dependencies
   - Build the application
   - Run tests (if available)
   - Post a confirmation comment
   - Prepare the deployment

### Example Comment

```
/deploy
```

Any comment containing `/deploy` will trigger the workflow.

## Workflow Details

The `deploy-on-reply` workflow:

- **Triggers on**: Issue comments and PR review comments (created or edited)
- **Requires**: `/deploy` keyword in the comment body
- **Runs on**: Ubuntu latest
- **Steps**:
  1. Checkout the relevant branch
  2. Setup Node.js 24
  3. Install npm dependencies
  4. Build the Next.js application
  5. Run tests (non-blocking)
  6. Post a confirmation comment
  7. Prepare deployment

## Required Secrets

The following GitHub secrets should be configured for the workflow to work:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `NEXTAUTH_URL` - Application URL
- `RESEND_API_KEY` - Email service API key
- `ANTHROPIC_API_KEY` - Claude API key
- `REPLIT_DEPLOYMENT_TOKEN` - Deployment authentication token (optional)

### Setting Secrets

1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add each required secret

## Deployment Targets

Currently, the workflow is configured to support:

- **Replit** (primary): Uses `REPLIT_DEPLOYMENT_TOKEN` for authentication
- **Vercel/Render**: Can be extended to support additional platforms

## Extending the Workflow

To add additional deployment targets:

1. Update the "Deploy to Replit" step with your deployment logic
2. Add necessary secrets to GitHub
3. Update this documentation

### Example: Adding Vercel Deployment

```yaml
- name: Deploy to Vercel
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
  run: |
    npm install -g vercel
    vercel deploy --prod --token $VERCEL_TOKEN
```

## Error Handling

If the workflow fails:

1. Check the GitHub Actions logs for errors
2. Verify all required secrets are configured
3. Ensure the branch builds successfully locally
4. A failure will post a comment indicating the deployment failed

## Security Considerations

- Only comments from repository members should be trusted
- The workflow runs on the branch referenced in the PR/issue
- All environment variables are protected by GitHub secrets
- The `/deploy` keyword should be used sparingly to avoid accidental deployments

## Troubleshooting

### Workflow Not Triggering

- Ensure the comment contains exactly `/deploy`
- Check that the event type (issue_comment or pull_request_review_comment) is correct
- Verify the workflow file is in `.github/workflows/` directory

### Build Failures

- Run `npm install && cd apps/web && npm run build` locally to reproduce
- Check for missing environment variables
- Ensure Node.js version matches the workflow (v24)

### Deployment Not Completing

- Verify deployment secrets are configured
- Check deployment target credentials are valid
- Review deployment logs for specific errors
