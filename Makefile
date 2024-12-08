push-prod:
	aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 382123305138.dkr.ecr.ap-south-1.amazonaws.com && \
	docker build -t portfolio-tracker-tg-bot --platform linux/amd64 --build-arg ENV=production . && \
	docker tag portfolio-tracker-tg-bot:latest 382123305138.dkr.ecr.ap-south-1.amazonaws.com/portfolio-tracker-tg-bot:latest && \
	docker push 382123305138.dkr.ecr.ap-south-1.amazonaws.com/portfolio-tracker-tg-bot:latest