🚀 Overview from local dev to deployed to Azure.

local development → source control → CI/CD pipelines → cloud hosting.

Local development setup

Initialize Git + push to GitHub

Connect GitHub to Azure DevOps (optional but common)

Create CI/CD pipelines in Azure DevOps

Deploy frontend + backend to Azure services

Each step below includes inline highlights so you can dive deeper into any part.

🧩 1. Local Development Setup

Your app consists of:

React frontend (Node/Yarn/NPM)

.NET 8 backend (Web API)

Typical local workflow

Run the backend API usingdotnet run

Run the React frontend usingnpm start or yarn start

Configure CORS + environment variables so the frontend can call the backend.

🌱 2. Initialize Git and Push to GitHub

Inside your project root:

Steps

Initialize Gitgit init

Create a .gitignore(Node modules, bin/obj, build artifacts)

Commit your codegit add . && git commit -m "Initial commit"

Create a GitHub repo

Push to GitHubgit remote add origin <repo-url>git push -u origin main

🔗 3. Connect GitHub to Azure DevOps (optional but common)

Azure DevOps can pull code directly from GitHub.

Steps

In Azure DevOps, create a new project

Go to Pipelines → New Pipeline

Choose GitHub as the source

Authorize Azure DevOps

Select your repository

Azure DevOps will propose a starter YAML pipeline

This gives you CI (build + test) for both frontend and backend.

⚙️ 4. Create CI/CD Pipelines in Azure DevOps

You typically create two pipelines:

🛠 Backend (.NET 8) Pipeline

A typical pipeline includes:

Restore NuGet packages

Build the .NET project

Run tests

Publish the appdotnet publish -c Release

Deploy to Azure App Service or Azure Container Apps

🎨 Frontend (React) Pipeline

A typical pipeline includes:

Install Node

Install dependenciesnpm install

Run testsnpm test

Build production bundlenpm run build

Deploy to Azure Static Web Apps or Azure Storage + CDN

☁️ 5. Deploying to Azure

You have multiple hosting options depending on your architecture.

🧩 Backend Deployment Options

Azure App Service (most common)

Azure Container Apps (if using Docker)

Azure Kubernetes Service (large-scale)

Azure DevOps will use a Service Connection to deploy automatically.

🎨 Frontend Deployment Options

Azure Static Web Apps(best for React)

Azure Storage Static Website + CDN

Azure App Service(if frontend + backend hosted together)

Azure DevOps can deploy the build folder to the chosen service.

🧭 6. End-to-End Flow Summary

Stage

What Happens

Local development

React + .NET run locally

GitHub

Code pushed + versioned

Azure DevOps CI

Build + test pipelines run

Azure DevOps CD

Deploy to Azure automatically

Azure

App is live on the cloud