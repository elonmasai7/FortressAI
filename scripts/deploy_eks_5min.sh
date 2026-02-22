#!/usr/bin/env bash
set -euo pipefail

# Fast path deploy for FortressAI Guardian to an existing EKS cluster.
# Prereqs: aws cli, kubectl, docker, and authenticated ECR access.

AWS_REGION="${AWS_REGION:-ap-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
ECR_REPO_BACKEND="${ECR_REPO_BACKEND:-fortressai-backend}"
ECR_REPO_FRONTEND="${ECR_REPO_FRONTEND:-fortressai-frontend}"
IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d%H%M%S)}"
K8S_NAMESPACE="${K8S_NAMESPACE:-fortressai}"

if [[ -z "$AWS_ACCOUNT_ID" ]]; then
  echo "AWS_ACCOUNT_ID is required"
  exit 1
fi

aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

docker build -t "$ECR_REPO_BACKEND:$IMAGE_TAG" ./backend
docker build -t "$ECR_REPO_FRONTEND:$IMAGE_TAG" ./frontend

docker tag "$ECR_REPO_BACKEND:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_BACKEND:$IMAGE_TAG"
docker tag "$ECR_REPO_FRONTEND:$IMAGE_TAG" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_FRONTEND:$IMAGE_TAG"

docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_BACKEND:$IMAGE_TAG"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_FRONTEND:$IMAGE_TAG"

kubectl create namespace "$K8S_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

kubectl -n "$K8S_NAMESPACE" set image deployment/fortress-backend fortress-backend="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_BACKEND:$IMAGE_TAG"
kubectl -n "$K8S_NAMESPACE" set image deployment/fortress-frontend fortress-frontend="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_FRONTEND:$IMAGE_TAG"

kubectl -n "$K8S_NAMESPACE" rollout status deployment/fortress-backend --timeout=180s
kubectl -n "$K8S_NAMESPACE" rollout status deployment/fortress-frontend --timeout=180s

echo "Deploy complete: $IMAGE_TAG"
