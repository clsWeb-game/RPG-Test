import detectEthereumProvider from '@metamask/detect-provider';
import { BrowserProvider } from 'ethers';

export async function getWeb3() {
  console.log('getWeb3 called');
  const provider = await detectEthereumProvider();
  if (!provider) {
    alert('Please install Metamask to continue.');
    return null;
  }

  if (provider !== window.ethereum) {
    alert('Please use the Metamask extension.');
    return null;
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  } catch (error) {
    console.error('User denied account access');
    return null;
  }

  // Returns an ethers.js BrowserProvider (equivalent to web3 instance)
  return new BrowserProvider(window.ethereum);
}
