const xlsx = require("xlsx");
const fs = require("fs");
const file = xlsx.readFile('./CProfile.xlsx')

let data = []
let profiles = {
    'Profile': [],
    'Interview': []
}

const sheets = file.SheetNames

for (let i = 0; i < sheets.length; i++) {
    const key = file.SheetNames[i]
    const temp = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[i]])
    temp.forEach((res) => {
        profiles[Object.keys(profiles)[i]].push(res)
    })
}
data.push(profiles)
data.map((item) => {
    console.log(item)
})
