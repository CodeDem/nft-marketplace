/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import DefaultLayout from "../../components/Layouts/DefaultLayout";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { nftAddress, nftMarketAddress } from "../../config";
import NFT from "../../artifacts/contracts/NFT.sol/NFT.json";
import MMarket from "../../artifacts/contracts/MMarket.sol/MMarket.json";
import { useRouter } from "next/dist/client/router";
import { toast } from "react-toastify";
//  In this component we set the IPFS up to host NFT data of file storage
const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const MintToken = () => {
  const [fileUrl, setFileUrl] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
  });
  const router = useRouter();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    try {
      const added = await client.add(file, {
        progress: (prog) => console.log(`received: ${prog}`),
      });
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log(error);
    }
  };

  const createMarket = async (e) => {
    e.preventDefault();
    const { name, description, price } = formData;
    if (!name || !description || !price || !fileUrl) return;
    //   upload to IPFS
    const data = JSON.stringify({ name, description, image: fileUrl });
    try {
      const added = await client.add(data);
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      // run a function that creates sale and passes in the url
      creatSale(url);
    } catch (error) {
      console.log(error);
    }
  };

  const creatSale = async (url) => {
    const toastId = toast.loading("Mingting NFT, please wait!");
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      //  we want to create the token
      let contract = new ethers.Contract(nftAddress, NFT.abi, signer);
      let transaction = await contract.mintToken(url);
      let tx = await transaction.wait();
      let event = tx.events[0];
      let value = event.args[2];
      let tokenId = value.toNumber();
      const price = ethers.utils.parseUnits(formData.price, "ether");

      // list the item for sale on the marketplace
      contract = new ethers.Contract(nftMarketAddress, MMarket.abi, signer);
      let listingPrice = await contract.getListingPrice();
      listingPrice = listingPrice.toString();

      transaction = await contract.makeMarketItem(nftAddress, tokenId, price, {
        value: listingPrice,
      });
      await transaction.wait();
      toast.update(toastId, {
        render: `Successfully minted the NFT`,
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
      router.push("/");
    } catch (error) {
      console.log(error);
      toast.update(toastId, {
        type: "error",
        isLoading: false,
        autoClose: 2000,
        render: `${error.data.message}`,
      });
    }
  };

  return (
    <DefaultLayout title="Mint NFT">
      <div className="min-h-full flex flex-col justify-center  sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-md sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={createMarket}>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                    }}
                    value={formData.name}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <div className="mt-1">
                  <input
                    id="description"
                    name="description"
                    type="text"
                    required
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                    }}
                    value={formData.description}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700"
                >
                  Price (MATIC)
                </label>
                <div className="mt-1">
                  <input
                    id="price"
                    name="price"
                    type="number"
                    required
                    onChange={(e) => {
                      setFormData({ ...formData, price: e.target.value });
                    }}
                    value={formData.price}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="file"
                  className="block text-sm font-medium text-gray-700"
                >
                  Asset image (Currently only one image is supported)
                </label>
                <div className="mt-1">
                  <input
                    id="file"
                    name="file"
                    type="file"
                    required
                    onChange={handleFileUpload}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {fileUrl && (
                    <img className="rounded mt-2 w-8" src={fileUrl} />
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Mint
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default MintToken;
