# Installation

## get secret

- create a new project at https://console.cloud.google.com/ (you'll need a Google account)
  - you'll need the project id in later steps
- select `APIs & Services`
- select `Enable APIs &Services`
- search for and enable Google Assistant API
- go back to `APIs & Services`
- - if you haven't enabled the consent screen already, do so by following the prompts. Make sure to add the `Google Assistant API` as a scope and yourself as a test user (now you don't have to push the app to production)
- select create credentials
  - for `OAuth Client Id`
  - for `application type` I chose Desktop
- download client_secret JSON
- I renamed mine to client_secret.json

## get token

google's oauth lib tool seems to be the easiest way to do this:

I had to use Python 3.5 for this.

1. you might want to use a virtual environment for this:

```sh
python -m venv venv
. venv/bin/activate #or venv/Scripts/activate for Windows
which python #make sure you're in the virtual env
```

2. install google-auth-oauthlib to fetch token info (replace client_secret.json w/ the path to your secret file downloaded previously)

```sh
python -m pip install --upgrade "google-auth-oauthlib[tool]" --trusted-host pypi.python.org
google-oauthlib-tool --scope https://www.googleapis.com/auth/assistant-sdk-prototype --client-secrets client_secret.json --credentials credentials.json --save
```

## register device model

> feel free to change the type, manufacturer, or product-name.
> the model must be a globally unique identifier, so Google recommends you to prefix w/ your project id

```sh
python -m pip install --upgrade google-assistant-sdk
googlesamples-assistant-devicetool --project-id YOUR_PROJECT_ID --credentials credentials.json register-model --model YOUR_PROJECT_ID-node-js-server1 --type LIGHT --manufacturer YOUR_NAME --product-name "Node JS Server"
googlesamples-assistant-devicetool --project-id YOUR_PROJECT_ID --credentials credentials.json register-device --device node-js-server --model YOUR_PROJECT_ID-
node-js-server1 --client-type SERVICE
```

check that it's registered:

```
googlesamples-assistant-devicetool --project-id YOUR_PROJECT_ID --credentials credentials.json list --model
```

- you'll need the Device Instance ID and Model for your env variables

## configuring .env

use .env.template as starter:
|variable|definition|
|---|---|
|PORT| port to run express server on/expose|
|CREDENTIALS_PATH| path to token file (not client_secret)|
|DEVICE_MODEL_ID|project's device model id|
|DEVICE_INSTANCE_ID|project's device instance id|
|GRCP_TRACE|trace logging level|
|GRCP_VERBOSITY|logging level (i think this is deprecated, but kept it in for now)|

## run

### Docker

```sh
docker compose up -d
```

### Node (v20)

```sh
node --env-file .env src/index.js
```
