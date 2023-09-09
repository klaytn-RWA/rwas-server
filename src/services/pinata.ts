import pinataSDK from "@pinata/sdk";

export const PinataUpload = async (img: string, attributes: Array<Object>) => {
  const pinata = new pinataSDK({ pinataApiKey: process.env.PINATA_KEY, pinataSecretApiKey: process.env.PINATA_SECRET });

  const data = {
    name: "Transca RWAs NFT",
    description: "This is Transca RWAs NFT collection!",
    image: img,
    attributes: attributes,
  };

  const upload = await pinata.pinJSONToIPFS(data);

  return upload;
};
