
import { RoomAssignment } from '@/components/room-assigmentadmin'
import React from 'react'

const page = () => {
  return (
     <main className="overflow-auto w-full h-full">
          <div className=" p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
          {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 ">
              <div>
                <h1 className="text-2xl sm:text-3xl mt-7 md:mt-0 font-bold text-gray-900">
                  Room Assignments 
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                  View and manage room assignments.
                </p>
              </div>
            </div>
            
            </div>
          </div>
          <RoomAssignment/>
        </main>
 
  )
}

export default page