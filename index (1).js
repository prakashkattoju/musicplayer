const xlsx = require("xlsx");
const fs = require("fs");
//Task 1: Read data from excel and store in to json file
//Step1: Read Excel File
//const wb = xlsx.readFile('./CreateProfile.xlsx')
/* //const wb = xlsx.readFile ('./CreateProfile.xlsx',{cellDates:true});
//const wb = xlsx.readFile ('./CreateProfile.xlsx',{dateNF:'mm/dd/yyy'});

//Step2: Read sheet 
//console.log(wb.SheetNames);
const ws=wb.Sheets['Create Profile','']
//console.log(ws);
//Step:3 Read sheet data and convert it into json
const data =xlsx.utils.sheet_to_json(ws);
//const data =xlsx.utils.sheet_to_json(ws.{raw:false}); */
const file = xlsx.readFile('./CreateProfile.xlsx')

let data = []
let profiles={
    'Profile': [],
    'Interview': [],
    'Followup': [],
    'Conversion': [],
    'Onboarding': [],
    'Material': [],
    'RollOn': [],
    'RSA': [],
    'Handover': [],
    'Rolloff': []
}

const sheets = file.SheetNames

for (let i = 0; i < sheets.length; i++) {
    const temp = xlsx.utils.sheet_to_json(
        file.Sheets[file.SheetNames[i]])
    temp.forEach((res) => {
        if(i === Object.keys(profiles)[i]){
            let obj = Object.values(profiles)[i];
            obj.push(res)
            data.push(obj)
        }
    })
}
console.log(data);
