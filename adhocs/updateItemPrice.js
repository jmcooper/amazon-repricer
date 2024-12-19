import dotenv from 'dotenv'
import { updateItemPrice } from '../app/amazon/seller-api.js'

dotenv.config()

const responseData = await updateItemPrice('013-DeseretIndust-5.25.24-Jim-519', 10.00)

console.log(responseData)