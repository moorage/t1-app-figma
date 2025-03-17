# t1-app-figma

## Overview

`t1-app-figma` is a Tier1 Frontend Figma App that integrates with Figma's OAuth 2.0 authorization flow. This app allows users to authorize and interact with Figma's API securely. It supports various OAuth scopes and handles the authorization process, including redirecting users to Figma's authorization endpoint and processing the authorization callback.

## Features

- OAuth 2.0 authorization with Figma
- Supports multiple OAuth scopes
- Handles authorization redirects and callbacks
- Fetches user (/me) information from Figma API

## Installation

To install the `t1-app-figma` package, you can use npm.

## Local Figma Integration Setup

This section explains how to configure your local development environment to connect with Figma. It covers common issues (like the invalid redirect/callback URL error) and the necessary steps to create a dedicated Figma app for your local server.

### Error Overview

When testing Figma integration locally, you may encounter an error like:

`Invalid Redirect/Callback URL`

This happens when the Figma account you’re using isn’t set up to allow the redirect URLs used by your local development server (for example, when using an [ngrok](https://ngrok.com/) URL).

### Requirements

- **Separate Figma App:**  
  You need to create a new Figma app dedicated to your local environment.  
  [Figma Developer Apps](https://www.figma.com/developers/apps)

- **Callback URL Configuration:**  
  Ensure the Figma app is configured with your callback URL. For example, if you’re using ngrok, your callback might look like:  
  `https://YOURACCOUNT.ngrok-free.app/api/apps/COM_FIGMA/callback`

- **Environment Variables:**  
  You must set the following environment variables in your Doppler configuration:
  - `APP_COM_FIGMA_CLIENT_ID`
  - `APP_COM_FIGMA_CLIENT_SECRET`

  These can be set in your project's Doppler config (e.g., in the `dev_personal` configuration for the `tier1-frontend` project).

### Steps to Setup

1. **Create a New Figma App:**
   - Go to the [Figma Developer Apps](https://www.figma.com/developers/apps) page.
   - Create a new app for your local environment.
   - Configure the app with the appropriate external callback URL (e.g., your ngrok URL).

2. **Configure Callback URLs:**
   - Ensure that the callback/redirect URL you are using (e.g., `https://YOURACCOUNT.ngrok-free.app/api/apps/COM_FIGMA/callback`) is listed in the Figma app settings.

3. **Set Up Environment Variables:**
   - Open your Doppler dashboard for the `tier1-frontend` project.
   - In the `dev_personal` configuration, set the following:
     - `APP_COM_FIGMA_CLIENT_ID` — the client ID from your new Figma app.
     - `APP_COM_FIGMA_CLIENT_SECRET` — the corresponding client secret.

4. **Test the Connection:**
   - With the correct settings and callback URL, run your local environment.
   - Verify that the Figma integration connects without the invalid redirect error.

### Important Notes

- **Using Ngrok:**  
  When using an ngrok URL, remember that this URL must be consistent with what is configured in your Figma app. Changes to the URL require an update to your Figma app's settings.

- **Account Considerations:**  
  If you initially received the error using a specific account (e.g., Horizon3 email), consider creating a separate Figma app that aligns with your local server’s configuration.

- **Documentation:**  
  It is recommended to document any additional steps or configuration changes needed as the project evolves.
