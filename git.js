const puppeteer = require('puppeteer')
const mongoose = require('mongoose')
const User = require('./usermodel.js')

const BASE_URL = "https://github.com/login"
const SEARCH_URL = "https://github.com/search"
const NB_PAGES = 5

const git = {
	browser: null,
	page: null,
	initialize: async () => {
		browser = await puppeteer.launch({headless:false,slowMo:10})
		page = await browser.newPage()
		await page.goto(BASE_URL, {waitUntil:'networkidle0'})
	},
	login: async () => {
		await page.focus('#login_field')
		await page.keyboard.type('naidaM')
		await page.focus('#password')
		await page.keyboard.type('PASSWORD')
		await page.click('#login > form > div.auth-form-body.mt-3 > input.btn.btn-primary.btn-block')
	},
	search: async () => {
		await page.waitFor(2000)
		await page.goto(SEARCH_URL, {waitUntil:'networkidle2'})
		await page.keyboard.type('type:user')
		await page.keyboard.press('Enter'); // presser Entrée 
		
		try {
			let allMails = []
			await page.waitFor(2000)
			let [users] = await page.$x('/html/body/div[4]/main/div/div[2]/nav[1]/a[9]')
			if (users) users.click()
			
			for (var p = 0; p < NB_PAGES; p++) {
				await page.waitForNavigation({waitUntil: 'networkidle0'})			
				await page.waitFor(4000)
					
				let mails = await page.evaluate(()=>{	
					let mailslist = []
						let qsmails = document.querySelectorAll('a.muted-link')
						for (var i = 0 ; i<qsmails.length ; i++)  {	
							let tmpuser = qsmails[i].parentNode.parentNode.parentNode.children[0].children[0].children[1].innerHTML
							let tmpmail = qsmails[i].innerHTML
							
							mailslist.push({
								user: tmpuser,
								mail: tmpmail
							})
						}
					return mailslist
				})
				console.log("Mails de la page ",p+1," :",mails)
				allMails = allMails.concat(mails)
				if(p!=NB_PAGES-1)await page.click('#user_search_results > div.paginate-container.codesearch-pagination-container > div > a.next_page')
			}
			console.log("Fin. Liste de tous les mails :", allMails)
			await browser.close()
			
				
			//Connecter et sauvegarder dans mongodb
			
			await mongoose.connect('mongodb+srv://naida:PASSWORD@scrap-viwts.gcp.mongodb.net/test?retryWrites=true&w=majority',{ 
				useNewUrlParser: true,
				useUnifiedTopology: true
			})
			for (var l=0; l< allMails.length; l++) {
					
				user = allMails[l].user	
				mail = allMails[l].mail	
				console.log(user, mail, " ajouté à la bd.")
					
				let u = new User({
					username:user,
					mail:mail
				})
				u.save(function(err){if(err) console.log(err);})
			}
		}
		catch(e) {
			console.log(e)
		}
	}
}

module.exports=git;
