"use client"

import React from "react"

const { useState } = React

const App = () => {
  const [result, setResult] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const triggerWorkflow = async () => {
    setIsLoading(true)
    setResult("")
    try {
      const response = await axios.post("/api/trigger-workflow")
      setResult(response.data.message)
    } catch (error) {
      const errorMessage = error.response ? JSON.stringify(error.response.data, null, 2) : error.message
      setResult("An error occurred:\n\n" + errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-md p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Mock SAP Workflow Notifier</h2>
        <p className="text-gray-600 mb-8">
          Click the button to simulate an SAP workflow. This will trigger the backend to generate an Adaptive Card and,
          in a production environment, send it to a Microsoft Teams channel.
        </p>

        <button
          onClick={triggerWorkflow}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
        >
          {isLoading ? "Processing..." : "Trigger SAP Workflow"}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">API Response:</h3>
            <pre className="text-sm text-gray-800 bg-white p-4 rounded-md shadow-inner overflow-x-auto whitespace-pre-wrap break-words">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
