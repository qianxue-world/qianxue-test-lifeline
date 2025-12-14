# GitHub Actions Workflows

## Automated Version Bumping and Deployment

This repository uses GitHub Actions to automatically:
1. **Bump version** on every commit to main/master/develop
2. **Build Docker image** with the new version
3. **Push to Docker Hub** with version tag and latest tag
4. **Update K8s manifests** (kustomization.yaml and deployment.yaml)
5. **Commit changes back** to the repository
6. **Create Git tag** for the new version

### Workflow: `docker-build.yml`

**Triggers:**
- Push to `main`, `master`, or `develop` branches
- Excludes changes to `k8s/**`, `VERSION`, and markdown files
- Skips if commit message contains `[skip ci]`

**Process:**
1. Reads current version from `VERSION` file
2. Bumps patch version (e.g., 1.0.0 → 1.0.1)
3. Builds multi-arch Docker image (amd64, arm64)
4. Pushes to Docker Hub with tags:
   - `omaticaya/lovetest-mbti:1.0.1` (version tag)
   - `omaticaya/lovetest-mbti:latest`
5. Updates `k8s/kustomization.yaml` with new version
6. Updates `k8s/deployment.yaml` with new image tag
7. Commits changes with message: `chore: bump version to X.Y.Z [skip ci]`
8. Creates Git tag: `vX.Y.Z`

**Required Secrets:**
- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Your Docker Hub access token
- `GITHUB_TOKEN` - Automatically provided by GitHub

### Version Management

The `VERSION` file contains the current semantic version:
```
1.0.0
```

**Version Format:** `MAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (auto-incremented by workflow)

### Manual Version Bump

To manually bump major or minor versions:

```bash
# Bump major version (1.0.0 → 2.0.0)
echo "2.0.0" > VERSION
git add VERSION
git commit -m "chore: bump major version to 2.0.0"
git push

# Bump minor version (1.0.0 → 1.1.0)
echo "1.1.0" > VERSION
git add VERSION
git commit -m "chore: bump minor version to 1.1.0"
git push
```

### Skip CI

To skip the workflow on a specific commit:
```bash
git commit -m "docs: update README [skip ci]"
```

### ArgoCD Integration

After the workflow completes:
1. New version is committed to the repository
2. K8s manifests are updated with the new image tag
3. ArgoCD detects the changes (if auto-sync is enabled)
4. ArgoCD deploys the new version to Kubernetes

### Monitoring Deployments

**View workflow runs:**
- Go to Actions tab in GitHub
- Click on "Build and Push Docker Image"
- View logs and deployment summary

**Check Docker Hub:**
```bash
# List all tags
docker pull omaticaya/lovetest-mbti:latest
docker images | grep lovetest-mbti
```

**Check ArgoCD:**
```bash
# View application status
argocd app get mbti-personality-test

# View sync status
argocd app sync mbti-personality-test
```

### Troubleshooting

**Workflow fails to push commits:**
- Ensure branch protection rules allow GitHub Actions to push
- Check that `GITHUB_TOKEN` has write permissions

**Docker build fails:**
- Check Dockerfile syntax
- Verify Docker Hub credentials in secrets
- Check build logs in Actions tab

**ArgoCD not syncing:**
- Verify ArgoCD is watching the correct repository path
- Check ArgoCD sync policy settings
- Manually trigger sync: `argocd app sync mbti-personality-test`

**Version conflicts:**
- If VERSION file is out of sync, manually update it
- Ensure no concurrent builds are running

### Best Practices

1. **Commit messages:** Use conventional commits
   - `feat:` for new features
   - `fix:` for bug fixes
   - `chore:` for maintenance
   - `docs:` for documentation

2. **Testing:** Test changes in a feature branch before merging to main

3. **Rollback:** Use Git tags to rollback to previous versions
   ```bash
   git checkout v1.0.5
   ```

4. **Monitoring:** Watch ArgoCD dashboard for deployment status

5. **Security:** Regularly rotate Docker Hub tokens

### Example Workflow Run

```
Commit: feat: add new payment feature
↓
Workflow triggered
↓
Version bumped: 1.0.5 → 1.0.6
↓
Docker image built: omaticaya/lovetest-mbti:1.0.6
↓
Pushed to Docker Hub
↓
K8s manifests updated
↓
Changes committed: chore: bump version to 1.0.6 [skip ci]
↓
Git tag created: v1.0.6
↓
ArgoCD detects changes
↓
New version deployed to Kubernetes
```

### Additional Workflows

**`docker-build-release.yml`** (if exists):
- Triggered on release creation
- Builds production-ready images
- Creates GitHub releases with changelog

### Support

For issues or questions:
1. Check workflow logs in Actions tab
2. Review this documentation
3. Check ArgoCD application status
4. Verify Docker Hub image tags
