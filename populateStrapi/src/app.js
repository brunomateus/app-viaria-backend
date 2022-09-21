import * as fs from 'fs';
import path from "path";
import { parse } from 'csv-parse/sync';
import { FormData } from 'formdata-node';
import fetch, { blobFrom } from 'node-fetch';

const __dirname = path.resolve()
const dbPath = path.join(__dirname, './images_info.csv')


function parseDMS(input) {
    let parts = input.split(/[^\d\w]+/);
    let data = convertDMSToDD(parts[0], parts[1], parts[2], parts[3]);

    return data;
}
  
function convertDMSToDD(degrees, minutes, seconds, miSeconds) {
    let dd =
    Number(degrees) +
    Number(minutes) / 60 +
    (Number(seconds) + Number(miSeconds) / 100) / 6000;

    return dd * -1;
}

const classeDeDefeitos = [
    'sem-defeitos',
    'pothole',
    'crack',
    'patch'
]


async function populate() {
    const fileContent = fs.readFileSync(dbPath);
    const records = parse(fileContent, {columns: true});
    for (let record of records) {
        const classe = classeDeDefeitos[Number(record.classe)]
        const codEndereco = record.cod_endereco
        const latitude = parseDMS(record.lat_geodesica)
        const longitude = parseDMS(record.long_geodesica)
        const dataColeta = record.data

        const coverPath = path.join(__dirname, `./${record.imagem}`)

        const json = JSON.stringify({
            endereco: codEndereco,
            latitude,
            longitude,
            classe,
            dataDeColeta:dataColeta
        })

        //console.log(json)
         const form = new FormData();

         form.append('data', json)
        
        const file = await blobFrom(coverPath, 'image/jpeg');
        form.append('files.imagem', file, path.basename(coverPath));

        
        const response = await fetch('http://127.0.0.1:1337/api/defeitos', {
            method: 'post',
            body: form
        });
        const data  =  await response.json()
        console.log(data)
        
    }
}

await populate()