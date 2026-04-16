# [1.5.0](https://github.com/yourdudeken/CaptureNest/compare/v1.4.0...v1.5.0) (2026-04-16)


### Features

* enhance journal functionality with legacy support and improved UI components ([2a3ae24](https://github.com/yourdudeken/CaptureNest/commit/2a3ae246e626b442293228cf659d19022a3da1b5))

# [1.4.0](https://github.com/yourdudeken/CaptureNest/compare/v1.3.1...v1.4.0) (2026-03-28)


### Features

* add Vite configuration and TypeScript build info for client application ([ff7fd09](https://github.com/yourdudeken/CaptureNest/commit/ff7fd098aaf7178a576f1765e45675066c9a6063))
* add Vite configuration and TypeScript build info for client application ([43a6913](https://github.com/yourdudeken/CaptureNest/commit/43a69138b6170705b02b7b697a13a296252f2f5f))

## [1.3.1](https://github.com/yourdudeken/CaptureNest/compare/v1.3.0...v1.3.1) (2026-03-11)


### Bug Fixes

* **auth:** downgrade fastify-jwt to v8, disable secure cookie for homelab http, fix healthcheck ipv6 ([fcf5c8d](https://github.com/yourdudeken/CaptureNest/commit/fcf5c8d51b991f28d11d823416b3c780ea7d3ea6))

# [1.3.0](https://github.com/yourdudeken/CaptureNest/compare/v1.2.0...v1.3.0) (2026-03-11)


### Features

* **auth:** implement initial setup and JWT login flow using fastify cookies and react context ([8e82141](https://github.com/yourdudeken/CaptureNest/commit/8e8214183b1d3b895adccc7b91082749a5d599c0))

# [1.2.0](https://github.com/yourdudeken/CaptureNest/compare/v1.1.1...v1.2.0) (2026-03-11)


### Features

* add app favicon and make sidebar responsive with open/close toggling state ([e25d615](https://github.com/yourdudeken/CaptureNest/commit/e25d615b48096cb72aebc7afc868b21a5e21e6e2))

## [1.1.1](https://github.com/yourdudeken/CaptureNest/compare/v1.1.0...v1.1.1) (2026-03-11)


### Bug Fixes

* remove qdrant healthcheck requirement for local deployment ([5a7dd84](https://github.com/yourdudeken/CaptureNest/commit/5a7dd841e798db0964838ddaeb0ef251287fc365))
* resolve frontend routing handler conflict and update video upload endpoint to handle webm properly ([5652ae3](https://github.com/yourdudeken/CaptureNest/commit/5652ae3a928973d0a760a463443e0646f9656a46))

# [1.1.0](https://github.com/yourdudeken/CaptureNest/compare/v1.0.0...v1.1.0) (2026-03-10)


### Features

* Consolidate web and server Dockerfiles into a single monorepo Dockerfile and update CI/CD to build a unified image. ([fe2ca4a](https://github.com/yourdudeken/CaptureNest/commit/fe2ca4a520fa245a344c3d21fe0fbef9349fb68c))

# 1.0.0 (2026-03-10)


### Features

* Add .env for database configuration and update server/docker-compose to use port 5433 ([cc935b1](https://github.com/yourdudeken/CaptureNest/commit/cc935b1f27522b83dffa45968801e1e35d1a40b5))
* add `.env.example` and update database schema to use UUIDs and `VARCHAR` types. ([da03c05](https://github.com/yourdudeken/CaptureNest/commit/da03c0574054d1b6f4e2c7580753be22370547d7))
* add a settings/menu page with user profile and theme toggle, and improve gallery grid image styling. ([39dd9e7](https://github.com/yourdudeken/CaptureNest/commit/39dd9e777a9a3a66154093f282faf9fef589a562))
* Add comprehensive development setup guide, enhance dev scripts with concurrent execution, and implement dynamic CORS configuration. ([6668fe4](https://github.com/yourdudeken/CaptureNest/commit/6668fe4760369a6a37b07735b9dc3e32c4c3384d))
* Add comprehensive environment variables for server, database, storage, authentication, and other application settings. ([d7374a9](https://github.com/yourdudeken/CaptureNest/commit/d7374a904a6d2e1a44fac3281c83d4f6b5eee296))
* Add comprehensive README.md detailing PhotoApp features, architecture, and setup instructions. ([044a5d3](https://github.com/yourdudeken/CaptureNest/commit/044a5d365b3abd52b2b48ee8863bc3955f9c9e7b))
* Add custom Docker network and assign services to it, removing explicit compose version. ([44c29f7](https://github.com/yourdudeken/CaptureNest/commit/44c29f7e3f5ea1cc3bfc51ae33b9836f2035c1b7))
* Add database setup script and update server's default database connection and local media path. ([4324417](https://github.com/yourdudeken/CaptureNest/commit/4324417f4f9947406437373d75a7f3ceb164e76a))
* Add Docker Compose setup for local development and refactor app names and workspaces. ([a83ab16](https://github.com/yourdudeken/CaptureNest/commit/a83ab1600f9057995b5302f4646afadc1bb70f9d))
* add media deletion endpoint and move gallery route to apps directory ([3b3c402](https://github.com/yourdudeken/CaptureNest/commit/3b3c402635188b50f4a69e0f172351fa268c205f))
* Add responsive mobile navigation and overlay, and enhance general UI with updated header, button, form, and typography styles. ([dd3af9f](https://github.com/yourdudeken/CaptureNest/commit/dd3af9fbe98c8900c6ccc9359b37713d6421e904))
* Generate and return JWT and refresh tokens upon user registration. ([a1230fe](https://github.com/yourdudeken/CaptureNest/commit/a1230fe1c117db0ca6225007b34cba6fcac0249c))
* Implement CI/CD pipelines with semantic-release, Docker image building, and add a test script. ([b9064f7](https://github.com/yourdudeken/CaptureNest/commit/b9064f7bcf89b1da0b4dc1077aa960dd170f0ee0))
* Implement dynamic video codec detection and fallback in `Capture.jsx` to improve recording compatibility, documented in `VIDEO_RECORDING_FIX.md`. ([30b4039](https://github.com/yourdudeken/CaptureNest/commit/30b40394c3fd3a73aff435acd09202c9f4318092))
* implement QR code login functionality with dedicated API routes and frontend component ([47844cb](https://github.com/yourdudeken/CaptureNest/commit/47844cb528bc862eccf89cc92e08d627e8d8d9c4))
* Implement theme and toast contexts, add Dashboard, Lightbox, and Settings pages, and enhance media capture with camera flip and upload progress. ([13c7422](https://github.com/yourdudeken/CaptureNest/commit/13c74221562bed01e254eaf873918e5c2fffb938))
* Implement video recording, flash control, and a unified shutter mechanism for an enhanced camera capture experience. ([e62fd82](https://github.com/yourdudeken/CaptureNest/commit/e62fd82cd9666b6c7997ba01c60de0d6836e33b5))
* Initialize Vite configuration for the web application, updating package and TypeScript settings across the project. ([ee936f7](https://github.com/yourdudeken/CaptureNest/commit/ee936f7e56ce2fd71518453866a9b66d03f7043b))
* Introduce Qdrant AI service, update date-fns dependency, and remove Images model. ([e71d957](https://github.com/yourdudeken/CaptureNest/commit/e71d957740fe35291de70a292f8f956ccdbca9cd))
* Introduce video aspect ratio selection, refine upload error handling, sanitize upload filenames, and configure Nginx for larger uploads. ([b7dae4c](https://github.com/yourdudeken/CaptureNest/commit/b7dae4c45b89bf1d41786c430404d4b42b24803a))
* Migrate web app Docker deployment to multi-stage build with Nginx and add Nginx configuration. ([4e58713](https://github.com/yourdudeken/CaptureNest/commit/4e58713d561985aea5938b3bf511cc14909cfcdb))
* Refactor mobile navigation to use `transform` for animation, update styling, and auto-close on link click. ([ef7d061](https://github.com/yourdudeken/CaptureNest/commit/ef7d0611b00be6b3db68a513f6805ae37e382439))
* Refine Nginx proxy and caching rules, update API path, and add server environment variables for secrets and ports. ([bb044da](https://github.com/yourdudeken/CaptureNest/commit/bb044da89d568a18ef7b94a0f4300434339b785b))
