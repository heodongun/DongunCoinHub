// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title OfficialDongunNFT
 * @dev ERC-721 NFT contract for DongunCoin Hub official NFTs
 * @notice This contract manages the official NFT collection for the platform
 */
contract OfficialDongunNFT is
    ERC721,
    ERC721URIStorage,
    ERC721Burnable,
    Ownable,
    Pausable,
    ReentrancyGuard
{
    uint256 private _nextTokenId;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string uri);
    event NFTWithdrawn(uint256 indexed tokenId, address indexed from, address indexed to);
    event BatchMinted(address[] recipients, uint256[] tokenIds);

    constructor(address initialOwner)
        ERC721("Official DongunCoin NFT", "DGCNFT")
        Ownable(initialOwner)
    {
        _nextTokenId = 1; // Start from token ID 1
    }

    /**
     * @dev Mints a new NFT to the specified address
     * @param to Address to receive the NFT
     * @param uri Metadata URI for the NFT
     * @return tokenId The ID of the newly minted token
     */
    function mint(address to, string memory uri)
        public
        onlyOwner
        whenNotPaused
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit NFTMinted(to, tokenId, uri);
        return tokenId;
    }

    /**
     * @dev Batch mints multiple NFTs to specified addresses
     * @param recipients Array of addresses to receive NFTs
     * @param uris Array of metadata URIs for the NFTs
     * @return tokenIds Array of newly minted token IDs
     */
    function batchMint(
        address[] memory recipients,
        string[] memory uris
    )
        public
        onlyOwner
        whenNotPaused
        returns (uint256[] memory)
    {
        require(recipients.length == uris.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty arrays");
        require(recipients.length <= 100, "Batch too large"); // Prevent gas issues

        uint256[] memory tokenIds = new uint256[](recipients.length);

        for (uint256 i = 0; i < recipients.length; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, uris[i]);
            tokenIds[i] = tokenId;
        }

        emit BatchMinted(recipients, tokenIds);
        return tokenIds;
    }

    /**
     * @dev Withdraws an NFT from the vault to a user's wallet
     * @param tokenId The ID of the token to withdraw
     * @param userWallet The user's destination wallet address
     */
    function withdrawNFT(uint256 tokenId, address userWallet)
        public
        onlyOwner
        whenNotPaused
        nonReentrant
    {
        require(ownerOf(tokenId) == owner(), "NFT not in vault");
        require(userWallet != address(0), "Invalid wallet address");

        address vaultWallet = owner();
        _transfer(vaultWallet, userWallet, tokenId);

        emit NFTWithdrawn(tokenId, vaultWallet, userWallet);
    }

    /**
     * @dev Returns the total number of NFTs minted
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @dev Pauses all token transfers and minting
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers and minting
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    // Required overrides for multiple inheritance
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
