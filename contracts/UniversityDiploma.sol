// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a-sbt/ERC721A-SBT.sol";

error ForbiddenError();
error DiplomaExistsError();
error MissingRequiredFieldsError();
error DiplomaNotFoundError();

contract UniversityDiploma is Ownable, ERC721A_SBT {
    mapping(address => bool) private editors;
    // used to keep diploma hash to tokenId reference
    mapping(bytes32 => uint256) private diplomas;
    // keeping tokenUris so the same uri won't be used twice
    mapping(string => bool) private uriCheckMap;
    // keeping mapping of tokenId to tokenUri, so each token can have different uri
    mapping(uint256 => string) private tokenUris;

    event DiplomaAdded(bytes32 hash, address student, uint256 tokenId);
    

    modifier onlyEditors() {
      if(!editors[msg.sender]) revert ForbiddenError();
      _;
    }

    modifier overrideGuard(bytes32 diplomaHash, string memory tokenUri) {
      bool diplomaExists = (diplomas[diplomaHash] > 0);
      bool tokenExists = uriCheckMap[tokenUri];
      if (diplomaExists || tokenExists) revert DiplomaExistsError();
      _;
    }

    constructor(string memory _name, string memory _symbol) ERC721A_SBT(_name, _symbol)payable {
        editors[msg.sender] = true;
    }

    function addEditor(address editorAddr) public onlyOwner {
      editors[editorAddr] = true;
    }

    function removeEditor(address editorAddr) public onlyOwner {
      delete editors[editorAddr];
    }

    function addDiploma(bytes32 diplomaHash, string calldata tokenUri, address student) public onlyEditors overrideGuard(diplomaHash, tokenUri) {
      uint256 tokenId = _nextTokenId();
      diplomas[diplomaHash] = tokenId;
      tokenUris[tokenId] = tokenUri;
      uriCheckMap[tokenUri] = true;
      _safeMint(student, 1);
      
      emit DiplomaAdded(diplomaHash, student, tokenId);
    }

    function removeDiploma(bytes32 diplomaHash) public onlyEditors {
      uint256 tokenId = diplomas[diplomaHash];
      if (tokenId == 0) revert DiplomaNotFoundError();
      delete diplomas[diplomaHash];
      string memory tokenUri = tokenUris[tokenId];
      delete tokenUris[tokenId];
      delete uriCheckMap[tokenUri];
      _burn(tokenId);
    }

    function verifyDiploma(bytes32 diplomaHash) public view returns(bool) {
      uint256 tokenId = diplomas[diplomaHash];
      return tokenId > 0;
    }

    function verifyDiploma(bytes32 diplomaHash, address studentAddr) public view returns(bool) {
      uint256 tokenId = diplomas[diplomaHash];
      if (tokenId == 0) return false;
      return ownerOf(tokenId) == studentAddr;
    }

    function getDiploma(bytes32 diplomaHash) public view returns(string memory) {
      uint256 tokenId = diplomas[diplomaHash];
      return tokenURI(tokenId);
    }

    function getStudentDiplomas(address studentAddr) public view returns(string[] memory) {
      uint256 count = balanceOf(studentAddr);
      string[] memory studentDiplomas = new string[](count);
      if (count == 0) return studentDiplomas;

      uint256 index;
      for (uint i = _startTokenId(); i < _nextTokenId(); ++i) {
          if (ownerOf(i) == studentAddr) { 
            studentDiplomas[index++] = tokenUris[i];
          }
      }

      return studentDiplomas;
    }

    // changing start index to be 1, so we can have existanse checks
    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    // returning different tokenUri for each token
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        return tokenUris[tokenId];
    }
}
