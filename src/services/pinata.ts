import pinataSDK from "@pinata/sdk";

export const PinataUpload = async (attributes: Array<Object>) => {
  const pinata = new pinataSDK({ pinataApiKey: process.env.PINATA_KEY, pinataSecretApiKey: process.env.PINATA_SECRET });
  const res = await pinata.testAuthentication();
  const data = {
    name: "Transca RWAs",
    description: "This is Transca RWAs NFT collection!",
    image: "https://ipfs.io/ipfs/QmXiYvoxPD1jNNuADR6duUoF8tszLxqUBVPyBLVRUFKsch",
    attributes: attributes,
  };

  const upload = await pinata.pinJSONToIPFS(data);

  return upload;
};
