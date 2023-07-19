# argo-argopetz

AtlanteanTrove, is a reward distribution system built on Ethereum using the Solidity programming language. It manages ERC20, ERC721, and ERC1155 token rewards for different rounds. The contract also imports the OpenZeppelin library for the mentioned token standards and ERC1155Receiver.

The contract has various structs like Reward, RewardData, Amount, and more, which store information about token rewards and their amounts for each round. There are mappings to track rewards and amounts for each round, as well as the users who have claimed them.

The contract has an onlyAdmin modifier to restrict certain functions to the admin, and it provides various functions to manage rewards and rounds:

setRoundExpiry: Sets the expiry timestamp for a given round.
startNewRound: Starts a new round with an expiry timestamp.
getRoundRewards: Returns rewards for a given round.
getRoundAmounts: Returns amounts for a given round.
claimRewards: Allows a user to claim rewards for a given round if they haven't claimed already and the round hasn't expired.
topUpRewards: Allows the admin to top up rewards for a given round.
Internal functions for handling ERC20, ERC721, and ERC1155 rewards separately.
