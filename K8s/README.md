# Frontend Kubernetes Deployment

## Files Created/Updated

1. **deployment.yaml** - Frontend deployment with health checks and resource limits
2. **service.yaml** - Service to expose the frontend within the cluster
3. **ingress.yaml** - Ingress for external access to the frontend
4. **environment.k8s.ts** - Kubernetes-specific environment configuration

## Deployment Order

Deploy the frontend after the backend services are running:

```bash
# 1. Deploy frontend
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

## Environment Configuration

The frontend uses service names for internal Kubernetes communication:
- **Backend API**: `http://backend-service:8089`
- **Keycloak**: `http://keycloak-service:8080`

## Accessing the Frontend

After deployment, the frontend will be accessible at:
- **Internal**: `http://frontend-service:80` (within cluster)
- **External**: `http://localhost/` (via ingress)

## Important Notes

1. **Environment Configuration**: Make sure your Angular build uses the correct environment file for Kubernetes
2. **CORS**: The backend needs to allow requests from the frontend service
3. **Service Discovery**: All services use Kubernetes DNS for communication







