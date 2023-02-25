import { useState } from "react";

import { useWeb3React } from "@web3-react/core";
import { Button, Dropdown, InputNumber, MenuProps, message, Space } from "antd";
import axios from "axios";
import { ethers } from "ethers";

import { items } from "../../../constants/tokenList";
import { useApprove } from "../../../hooks/useApprove";
import AddressInput from "../../AddressInput";

const styles = {
  buttonTransfer: {
    display: "flex",
    margin: "15px 0"
  }
} as const;
// const { confirm } = Modal;

const TransferToken: React.FC = () => {
  const { account, provider } = useWeb3React();
  // const balance = useNativeBalance(provider, account);
  const [amount, setAmount] = useState<number | null>();
  const [receiver, setReceiver] = useState<string>();
  const [tokenAddress, setTokenAddress] = useState<string>(items[0].key);

  const { allowance, getAllowance, handleApprove } = useApprove(tokenAddress, process.env.REACT_APP_CONTRACT || "");

  const showConfirm = async () => {
    const allow = await getAllowance();
    if (allow == 0) {
      await handleApprove();
    }
  };

  function handleSignMessage(event: { preventDefault: () => void }): void {
    event.preventDefault();

    if (!provider || !account) {
      window.alert("Wallet not connected");
      return;
    }

    const ABI = ["function transferFrom(address _from, address _to, uint _value)"];
    const iface = new ethers.utils.Interface(ABI);
    const callData = iface.encodeFunctionData("transferFrom", [
      account,
      receiver,
      ethers.utils.parseEther(amount?.toString() || "0")
    ]);

    async function transfer(): Promise<void> {
      if (provider) {
        try {
          const signature = await provider.getSigner(account).signMessage("Relay" + callData);
          axios
            .post(`${process.env.REACT_APP_API}/transaction-records`, [
              {
                userAddress: account,
                targetAddress: tokenAddress,
                signature: signature,
                callData: callData
              }
            ])
            .then(() => {
              message.info("Your request is success");
            });
        } catch (error) {
          if (typeof error === "string") {
            message.error("Error!" + `\n\n${error}`);
          } else if (error instanceof Error) {
            message.error("Error!" + `\n\n${error.message}`);
          }
        }
      }
    }
    if (amount) transfer();
  }

  const onClick: MenuProps["onClick"] = ({ key }) => {
    message.info(`Click on item ${key}`);
    setTokenAddress(key);
  };

  return (
    <div style={{ width: "40%", minWidth: "250px" }}>
      <Dropdown menu={{ items, onClick }}>
        <a
          onClick={(e) => {
            e.preventDefault();
          }}
          style={{ marginBottom: "10px" }}
        >
          <label>{tokenAddress}</label>
          <Space>Choose a token</Space>
        </a>
      </Dropdown>
      <AddressInput onChange={setReceiver} address={receiver} />
      <div style={{ display: "inline-flex", gap: "10px", width: "100%" }}>
        <InputNumber
          value={amount}
          onChange={setAmount}
          placeholder="Amount to transfer"
          min={0}
          style={{ width: "100%", height: "80%", marginBlock: "auto" }}
        />

        <div style={styles.buttonTransfer}>
          <Button
            type="primary"
            shape="round"
            onClick={async (e) => {
              if (allowance <= 0) {
                await showConfirm();
              }
              console.log({ allowance });

              handleSignMessage(e);
            }}
          >
            Sign and Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransferToken;
