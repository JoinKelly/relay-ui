import { useEffect, useState } from "react";

import { useWeb3React } from "@web3-react/core";
import { constants, utils } from "ethers";
import Web3 from "web3";

import { useToken } from "./useToken";

export const useApprove = (bep20Token: string, spender: string) => {
  const isAddress = bep20Token && Web3.utils.isAddress(bep20Token) && Web3.utils.isAddress(spender);
  const { account } = useWeb3React();
  const tokenContract = bep20Token ? useToken(bep20Token).contract : undefined;
  const [allowance, setAllowance] = useState<string | number>(0);
  const [isFetchingAllowance, setIsFetchingAllowance] = useState(false);

  const getAllowance = async () => {
    try {
      setIsFetchingAllowance(true);
      const res = await tokenContract?.allowance(account || "", spender);
      setAllowance(utils.formatEther(res || 0));
      return res ? utils.formatEther(res) : 0;
    } catch (e) {
      console.log(e, "err");
      return e;
    } finally {
      setIsFetchingAllowance(false);
    }
  };

  const handleApprove = async () => {
    const txn = await tokenContract?.approve(spender, constants.MaxUint256);
    await txn?.wait();
  };

  useEffect(() => {
    if (isAddress) {
      getAllowance();
    }
    // eslint-disable-next-line
  }, [isAddress, account]);

  return {
    allowance,
    handleApprove,
    getAllowance,
    isFetchingAllowance
  };
};
