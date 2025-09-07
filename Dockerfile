#use Node.js LTS
FROM node:18

#Create app dir
WORKDIR /app

#Install dependencies
COPY package*.json ./
RUN npm install --production

#Copy project files
COPY . .

#Expose app port
EXPOSE 3000

#Start app
CMD ["npm", "start"]