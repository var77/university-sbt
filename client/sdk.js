const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const DiplomaTypeMap = {
    0: 'Bachelor',
    1: 'Masters',
    2: 'Candidate of PHD',
    3: 'PHD'
}

const ipfsClient = IpfsHttpClient.create('http://localhost:5001/api/v0')

const connectToMetamask = async (retry) => {
  if (window.selectedAddress) return [true, window.selectedAddress];
  const accounts = await window.web3Instance.eth.getAccounts();
  if (accounts.length === 0) {
    if (retry) return [false, ZERO_ADDRESS];
    await window.ethereum.enable();
    return connectToMetamask();
  }
  window.selectedAddress = accounts[0];
  return [true, accounts[0]];
};

const loadContract = async (contractInfo) => {
  const networkId = await window.web3Instance.eth.net.getId();
  const networkData = contractInfo.networks[networkId];
  if (!networkData) return [];

  window.contract = new window.web3Instance.eth.Contract(contractInfo.abi, networkData.address);

  return window.contract;
};

const loadWeb3 = async () => {
  if (window.ethereum) {
    window.web3Instance = new window.Web3(window.ethereum);
  } else {
    window.alert(
      'Metamask not installed',
    );
  }
};

const addDiploma = async (diplomaHash, tokenUri, studentAddr) => {
      await connectToMetamask();
      console.log(diplomaHash, tokenUri, studentAddr);
      await window.contract.methods.addDiploma(diplomaHash, tokenUri, studentAddr).send({ from: window.selectedAddress, value: 0 });
}


const verifyDiploma = async (diplomaHash) => {
      const verified = await window.contract.methods.verifyDiploma(diplomaHash).call();
      return verified;
};

const verifyDiplomaForStudent = async (diplomaHash, studentAddress) => {
      const verified = await window.contract.methods.verifyDiploma(diplomaHash, studentAddress).call();
      return verified;
};

const getDiploma = async (diplomaHash) => {
      const diploma = await window.contract.methods.getDiploma(diplomaHash).call();
      return diploma;
}

const getStudentDiplomas = async (address) => {
      const diplomas = await window.contract.methods.getStudentDiplomas(address).call();
      return diplomas;
}

const addEditor = async (address) => {
      await connectToMetamask();
      const diplomas = await window.contract.methods.addEditor(address).call();
      return diplomas;
}

function getFileHashObserver(inputId) {
  const fileInput = document.getElementById(inputId);
  if (!fileInput) throw new Error('Input not found');
  let subscriptionCb = null;

  fileInput.onchange = () => {
    if(fileInput.files[0] == undefined) {
      return ;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      crypto.subtle.digest('SHA-256', ev.target.result).then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        subscriptionCb && subscriptionCb(hashHex);
      }).catch(ex => console.error(ex));
    };
    reader.onerror = function(err) {
      console.error("Failed to read file", err);
    }
    reader.readAsArrayBuffer(fileInput.files[0]);
  }
  return {
    subscribe: (cb) => {
        subscriptionCb = cb;
        return () => subscriptionCb = null;
    }
  }
}

const normalizeUrl = url => url.replace("ipfs://", "http://localhost:8082/ipfs/");

const getDiplomaInfoText = (diploma) => {
  // the best UI + XSS for free :P
  const img = normalizeUrl(diploma.image);
  const file = normalizeUrl(diploma.external_url);
  const hash = diploma.attributes[0].value;
  const dateStart = diploma.attributes[1].value;
  const dateEnd = diploma.attributes[2].value;
  const gpa = diploma.attributes[3].value;
  const faculty = diploma.attributes[4].value;
  const degree = diploma.attributes[5].value;
  return `
    <img src="${img}" width="125" height="125" /> <br>
    Verified: true <br>
    Type: ${degree}<br>
    Hash: ${hash}<br>
    Dates: ${dateStart} - ${dateEnd}<br>
    Faculty: ${faculty}<br>
    GPA: ${gpa}<br>
    Diploma File: <a href="${file}">${file}</a><br>
  `
};

async function uploadFileToIPFS(inputId) {
  const input = document.getElementById(inputId);
  const file = input.files[0]
  const added = await ipfsClient.add(file)
  return `ipfs://${added.path}`;
};

async function uploadMetadataToIPFS(data) {
  const added = await ipfsClient.add(JSON.stringify(data, null, 2));
  return `ipfs://${added.path}`;
};

async function onAddDiploma(addDiplomaHash) {
    const diplomaType = +document.getElementById('diploma-type').value;
    const gpa = +document.getElementById('gpa').value;
    const diplomaFileUrl = await uploadFileToIPFS('add-file-input');
    const diplomaImageUrl = await uploadFileToIPFS('diploma-image');
    const degree = DiplomaTypeMap[diplomaType];
    const dateStart = document.getElementById('start-date').value;
    const dateEnd = document.getElementById('end-date').value;
    const faculty = document.getElementById('faculty').value;

    const diploma = {
      name: 'University Diploma',
      description: `Diploma of ${degree} degree`,
      image: diplomaImageUrl,
      external_url: diplomaFileUrl,
      attributes: [
        { trait_type: 'hash', value: addDiplomaHash },
        { trait_type: 'Date of admission', value: dateStart },
        { trait_type: 'Date of graduation', value: dateEnd },
        { trait_type: 'GPA', value: gpa },
        { trait_type: 'faculty', value: faculty },
        { trait_type: 'degree', value: degree },
      ]
    };
    const metadataUrl = await uploadMetadataToIPFS(diploma);
    addDiploma(addDiplomaHash, metadataUrl, document.getElementById('add-student-address').value);
}

async function onCheckDiploma(checkDiplomaHash) {
    const addr = document.getElementById('check-student-address').value
    const verified = addr ? await verifyDiplomaForStudent(checkDiplomaHash, addr) : await verifyDiploma(checkDiplomaHash);
    if (!verified) return alert("Diploma not found, invalid!");
    const metadataUrl = await getDiploma(checkDiplomaHash);
    const metadataResponse = await fetch(normalizeUrl(metadataUrl));
    const diplomaInfo = getDiplomaInfoText(await metadataResponse.json());
    document.getElementById('diploma-info-check').innerHTML = diplomaInfo;
}

async function onGetStudentDiplomas() {
    const addr = document.getElementById('get-student-address').value
    let diplomas =  await getStudentDiplomas(addr);
    diplomas = await Promise.all(diplomas.map(async metadataUrl => {
      const metadataResponse = await fetch(normalizeUrl(metadataUrl));
      return metadataResponse.json();
    }));
    const diplomaInfos = diplomas.reduce((acc, el) => acc += `<p>${getDiplomaInfoText(el)}</p>`, '');
    document.getElementById('get-diplomas-info').innerHTML = diplomaInfos;
}

document.addEventListener('DOMContentLoaded', async () => { 
  await loadWeb3();
  const contract = await fetch('/contract.json');
  let addDiplomaHash = '';
  let checkDiplomaHash = '';
  await loadContract(await contract.json());

  getFileHashObserver('add-file-input').subscribe(fileHash => {
    addDiplomaHash = fileHash;
  });
  getFileHashObserver('check-file-input').subscribe(fileHash => {
    checkDiplomaHash = fileHash;
  });

  document.getElementById('add-student-diploma').onclick = async () => onAddDiploma(addDiplomaHash);

  document.getElementById('check-student-diploma').onclick = async () => onCheckDiploma(checkDiplomaHash);

  document.getElementById('get-student-diplomas').onclick = async () => onGetStudentDiplomas();
});
