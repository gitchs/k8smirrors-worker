# k8smirrors

## WHAT FOR?
It's slow to download k8s image directly in some area, this worker script will proxy your request to `registry.k8s.io` and handle redirections automatically.

## HOW TO DEPLOY
```bash
git clone https://github.com/gitchs/k8smirrors-worker.git
cd k8smirrors-worker
npm run deploy
```

## HOW TO USE IT

### Change your image name directly
```bash
docker pull registry.k8s.io/pause:3.6
#      ==> 
docker pull ${WORKER_DOMAIN}/pause:3.6
```

### Setup mirror for containerd
```toml
# Append next two lines /etc/containerd/config.toml 
[plugins."io.containerd.grpc.v1.cri".registry.mirrors."registry.k8s.io"]
endpoint = ["${WORKER_DOMAIN}"]
```
