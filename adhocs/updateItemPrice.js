import dotenv from 'dotenv'
import { updateItemPrice } from '../app/amazon/seller-api.js'

dotenv.config()

const responseData = await updateItemPrice('013-DeseretIndust-5.25.24-Jim-519', 16.9)

console.log(responseData)