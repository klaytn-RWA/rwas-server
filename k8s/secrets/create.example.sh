hash() {
  echo $(echo "$1" | tr -d '\n' | base64)
}

export ENV=$(hash production)
export NAMESPACE_RAW=staging

export PRODUCTION=$(hash true)

export PINATA_KEY=$(hash "")
export PINATA_SECRET=$(hash "")

export ACCOUNT_KEY=$(hash "")
export RPC_URL=$(hash "")
export TRANSCA_NFT_SMC_ADDRESS=$(hash "")

# gen
envsubst < ./secrets.template.yml > gen.secrets-${NAMESPACE_RAW}.yml
