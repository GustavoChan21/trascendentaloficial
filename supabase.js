import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const supabase = url && key ? createClient(url, key) : null
export const hasCloud = Boolean(supabase)
export async function loadSite() {
  const { data, error } = await supabase.from('site_state').select('content').eq('id','main').single()
  if (error) throw error
  return data?.content
}
export async function saveSite(content) {
  const { error } = await supabase.from('site_state').update({content,updated_at:new Date().toISOString()}).eq('id','main')
  if (error) throw error
}
export async function loadBookings() {
  const { data,error } = await supabase.from('tour_bookings').select('id,payload,status,created_at,expires_at').order('created_at',{ascending:false}).limit(500)
  if (error) throw error
  return (data||[]).map(b=>({...b.payload,id:b.id,status:b.status,createdAt:b.created_at,expiresAt:b.expires_at}))
}
export async function setBookingStatus(id,status) {
  const {error} = await supabase.from('tour_bookings').update({status}).eq('id',id)
  if(error) throw error
}
export async function checkAvailability(serviceId,date,time) {
  const {data,error} = await supabase.rpc('available_seats',{p_service_id:serviceId,p_date:date,p_time:time})
  if(error) throw error
  return data
}
export async function createBookingCloud(service,form) {
  const {data,error} = await supabase.rpc('create_tour_booking',{
    p_service_id:service.id,p_date:form.date,p_time:form.time,p_people:Number(form.adults),
    p_name:form.name,p_phone:form.phone,p_email:form.email,p_notes:form.notes
  })
  if(error) throw error
  return data
}
export async function registerProofCloud(booking,name) {
  const {data,error} = await supabase.rpc('register_proof_name',{p_booking_id:booking.id,p_token:booking.claimToken,p_name:name})
  if(error) throw error
  if(!data) throw new Error('El apartado venció o no es válido')
}
