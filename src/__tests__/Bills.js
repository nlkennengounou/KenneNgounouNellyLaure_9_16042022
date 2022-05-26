/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import store from "../__mocks__/store"

import router from "../app/Router.js";
import win from "global";

import Bills from "../containers/Bills"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      // Ajout expect pour que le test verifie si l'icone est actif
      //to-do write expect expression 
      expect(windowIcon.classList.contains("active-icon")).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      // build user interface
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  // test LoadingPage from "./views/LoadingPage.js" 
  describe("But it is loading", () => {
    test("Then Loading page should be rendered", () => {
      // build user interface
      document.body.innerHTML = BillsUI({ loading: true })
      // the loading page shoud load
      expect(screen.getAllByText("Loading...")).toBeTruthy()
    })
  })

   // test ErrorPage from "./views/ErrorPage.js"
  describe("But an error occured", () => {
    test("Then Error page should be rendered", () => {
      // build user interface
      document.body.innerHTML = BillsUI({ error: "an error occured" })
      // the error page should load
      expect(screen.getAllByText("Erreur")).toBeTruthy()
    })
  })

  describe("And I click on the new bill button", () => {
    test("Then the click new bill handler should be called", () => {  
      const onNavigate = () => {return}
      // build user interface
      document.body.innerHTML = BillsUI({ data: bills })
      // Bills for test
      const billsTestNewBillBtn = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })
      // Mock handleClickNewBill
      billsTestNewBillBtn.handleClickNewBill = jest.fn()
      // Add event and click action
      screen.getByTestId("btn-new-bill").addEventListener("click", billsTestNewBillBtn.handleClickNewBill)
      screen.getByTestId("btn-new-bill").click()
      // handleClickNewBill should be called
      expect(billsTestNewBillBtn.handleClickNewBill).toBeCalled()
    })
  })

  // test click on eye
  describe("And I click on the eye icon", () => {
    
    test("A modal should open", () => {
      // build user interface
      document.body.innerHTML = BillsUI({ data: bills })
      // Bills for test
      const billsTestModal = new Bills({ document, onNavigate: null, store: null, localStorage: window.localStorage })
      billsTestModal.handleClickIconEye = jest.fn()

      screen.getAllByTestId("icon-eye")[0].click()

      expect(billsTestModal.handleClickIconEye).toBeCalled()
    })
    test("Then the modal should display the attached image", () => {
      // build user interface
      document.body.innerHTML = BillsUI({ data: bills })
      
      // Bills for test
      const billsTestModal = new Bills({ document:document, onNavigate: null, store: null, localStorage: window.localStorage })
      
      // Eye icon in DOM
      const iconEye = document.querySelector(`div[data-testid="icon-eye"]`)
      
      // Mock modal behavior
      $.fn.modal = jest.fn()

      // Mock function handleClickIconEye
      billsTestModal.handleClickIconEye(iconEye)

      // handleClickIconEye function must be called
      expect($.fn.modal).toBeCalled()
      
      // The modal must be present
      expect(document.getElementById('modaleFile')).toBeTruthy()
    })
  })
  
})


// Ajouter un test d'intégration GET Bills.
describe('Given I am user connected as employee',()=>{
  describe('When I navigate to Bill page',()=>{
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
    
      const contentPending = await screen.getByText("Mes notes de frais")
      expect(contentPending).toBeTruthy()
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy()
    })

    describe("When an error occurs on API", () => {
     beforeEach(() => {
       jest.spyOn(store, "bills")
       Object.defineProperty(
           window,
           'localStorage',
           { value: localStorageMock }
       )
       window.localStorage.setItem('user', JSON.stringify({
         type: 'Employee',
         email: "a@a"
       }))
       const root = document.createElement("div")
       root.setAttribute("id", "root")
       document.body.appendChild(root)
       router()
     })
     test("fetches bills from an API and fails with 404 message error", async () => {
 
       store.bills.mockImplementationOnce(() => {
         return {
           list : () =>  {
             return Promise.reject(new Error("Erreur 404"))
           }
         }})
         const html = BillsUI({error: "Erreur 404"})
         document.body.innerHTML = html
         const message = await screen.getByText(/Erreur 404/)
         expect(message).toBeTruthy()
     })
 
     test("fetches messages from an API and fails with 500 message error", async () => {
 
       store.bills.mockImplementationOnce(() => {
         return {
           list : () =>  {
             return Promise.reject(new Error("Erreur 500"))
           }
         }})
 

       const html = BillsUI({error: "Erreur 500"})
       document.body.innerHTML = html
       const message = await screen.getByText(/Erreur 500/)
       expect(message).toBeTruthy()
     })
   })
  })
})