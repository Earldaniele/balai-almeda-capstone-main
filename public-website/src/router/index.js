import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RoomsView from '../views/RoomsView.vue'
import VirtualTourView from '../views/VirtualTourView.vue'
import LocationView from '../views/LocationView.vue'
import ContactView from '../views/ContactView.vue'
import SignUpView from '../views/SignUpView.vue'
import LoginView from '../views/LoginView.vue'
import PrivacyView from '../views/PrivacyView.vue'
import CookiesView from '../views/CookiesView.vue'
import BookingView from '../views/BookingView.vue'
import BookingSuccessView from '../views/BookingSuccessView.vue'
import RoomsDetailsView from '../views/RoomsDetailsView.vue'
import AvailabilityView from '../views/AvailabilityView.vue'
import ProfileView from '../views/ProfileView.vue'
import MyBookingsView from '../views/MyBookingsView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/rooms',
      name: 'rooms',
      component: RoomsView
    },
    {
      path: '/virtual-tour',
      name: 'virtual-tour',
      component: VirtualTourView
    },
    {
      path: '/location',
      name: 'location',
      component: LocationView
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignUpView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: PrivacyView
    },
    {
      path: '/cookies',
      name: 'cookies',
      component: CookiesView
    },
    {
      path: '/booking',
      name: 'booking',
      component: BookingView
    },
    {
      path: '/booking-success',
      name: 'booking-success',
      component: BookingSuccessView
    },
    {
      path: '/rooms/details',
      name: 'rooms-details',
      component: RoomsDetailsView
    },
    {
      path: '/availability',
      name: 'availability',
      component: AvailabilityView
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView
    },
    {
      path: '/bookings',
      name: 'bookings',
      component: MyBookingsView
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
