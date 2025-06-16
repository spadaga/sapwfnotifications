import axios from "axios"
import { getAccessToken } from "./auth.js"

async function approveWorkflow(instanceId) {
  try {
    const accessToken = await getAccessToken()
    console.log(`Approving workflow ${instanceId}...`)

    const response = await axios.post(
      `https://c6674ca9trial.authentication.ap21.hana.ondemand.com/http/postSAPdata?DecisionKey=0001&InstanceID=${instanceId}&Comments=Approved`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/xml,application/json",
          "Content-Type": "application/json",
        },
      },
    )

    console.log("Approval response:", response.data)
    return response.data?.Status || "COMPLETED"
  } catch (error) {
    console.error(`Error approving workflow ${instanceId}:`, error)
    throw new Error(`Failed to approve workflow ${instanceId}: ${error.message}`)
  }
}

async function rejectWorkflow(instanceId) {
  try {
    const accessToken = await getAccessToken()
    console.log(`Rejecting workflow ${instanceId}...`)

    const response = await axios.post(
      `https://c6674ca9trial.authentication.ap21.hana.ondemand.com/http/postSAPdata?DecisionKey=0002&InstanceID=${instanceId}&Comments=Rejected`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/xml,application/json",
          "Content-Type": "application/json",
        },
      },
    )

    console.log("Rejection response:", response.data)
    return response.data?.Status || "COMPLETED"
  } catch (error) {
    console.error(`Error rejecting workflow ${instanceId}:`, error)
    throw new Error(`Failed to reject workflow ${instanceId}: ${error.message}`)
  }
}

function createIndividualApprovalCard(workflow, isLiveData = true) {
  try {
    if (!workflow || typeof workflow !== "object") {
      throw new Error("Invalid workflow object provided")
    }

    const isMockData = !isLiveData

    let safeWorkflow
    if (isMockData) {
      safeWorkflow = {
        TaskTitle: workflow.TaskTitle || "Untitled Task",
        Status: workflow.Status || "READY",
        InstanceID: workflow.InstanceID || "N/A",
        TaskDetails: workflow.TaskDetails || "",
        CreatedByName: workflow.CreatedByName || "Unknown",
        CreatedOn: workflow.CreatedOn || new Date().toISOString(),
        InboxURL: workflow.InboxURL || "#",
      }
    } else {
      safeWorkflow = {
        TaskTitle: workflow.TASK_TITLE || "Untitled Task",
        Status: workflow.Status || "READY",
        InstanceID: workflow.INST_ID || "N/A",
        TaskDetails: workflow.TASKDETAILS || "",
        CreatedByName: workflow.CREATED_BY_NAME || "Unknown",
        CreatedOn: workflow.CREATED_ON || new Date().toISOString(),
        InboxURL: workflow.INBOXURL || "#",
      }
    }

    let companyCode = "N/A",
      amount = "N/A",
      documentType = "N/A"
    if (safeWorkflow.TaskDetails) {
      const companyCodeMatch = safeWorkflow.TaskDetails.match(/Company Code\s*:\s*([^#$]+)/)
      if (companyCodeMatch) companyCode = companyCodeMatch[1].trim()
      const amountMatch = safeWorkflow.TaskDetails.match(/Amount\s*:\s*([^#$]+)/)
      if (amountMatch) amount = amountMatch[1].trim()
      const docTypeMatch = safeWorkflow.TaskDetails.match(/Document Type\s*:\s*([^#$]+)/)
      if (docTypeMatch) documentType = docTypeMatch[1].trim()
    }

    let formattedDate = "N/A"
    try {
      const parts = String(safeWorkflow.CreatedOn).split(".")
      if (parts.length === 3) {
        const [day, month, year] = parts
        const createdDate = new Date(`${year}-${month}-${day}`)
        if (!isNaN(createdDate.getTime())) {
          formattedDate = createdDate.toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric" })
        }
      } else {
        const createdDate = new Date(safeWorkflow.CreatedOn)
        if (!isNaN(createdDate.getTime())) {
          formattedDate = createdDate.toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric" })
        }
      }
    } catch (dateError) {
      console.warn("Date formatting error:", dateError.message)
    }

    const mentionTextBlock = {
      type: "TextBlock",
      text: `A new workflow requires your attention, <at>channel</at>.`,
      wrap: true,
    }

    const cardBody = [
      mentionTextBlock,
      {
        type: "Container",
        items: [
          {
            type: "TextBlock",
            text: `${safeWorkflow.TaskTitle.split(" ").slice(0, 3).join(" ")}${isMockData ? " (MOCK)" : ""}`,
            weight: "bolder",
            size: "medium",
            wrap: true,
            color: isMockData ? "attention" : "default",
          },
        ],
        spacing: "medium",
      },
    ]

    if (isMockData) {
      cardBody.push({
        type: "Container",
        items: [
          {
            type: "TextBlock",
            text: "⚠️ MOCK DATA - Sample workflow for testing purposes",
            size: "small",
            color: "attention",
            weight: "bolder",
            horizontalAlignment: "center",
          },
        ],
        spacing: "small",
        style: "warning",
      })
    }

    cardBody.push({
      type: "Container",
      items: [
        {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              width: "auto",
              items: [{ type: "TextBlock", text: "Task Title:", weight: "bolder", size: "small", color: "dark" }],
            },
            {
              type: "Column",
              width: "stretch",
              items: [{ type: "TextBlock", text: safeWorkflow.TaskTitle, size: "small", color: "dark", wrap: true }],
            },
          ],
          spacing: "small",
        },
        {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              width: "auto",
              items: [{ type: "TextBlock", text: "Status:", weight: "bolder", size: "small", color: "dark" }],
            },
            {
              type: "Column",
              width: "stretch",
              items: [{ type: "TextBlock", text: safeWorkflow.Status, size: "small", color: "dark" }],
            },
          ],
          spacing: "small",
        },
        {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              width: "auto",
              items: [{ type: "TextBlock", text: "Instance ID:", weight: "bolder", size: "small", color: "dark" }],
            },
            {
              type: "Column",
              width: "stretch",
              items: [
                {
                  type: "TextBlock",
                  text: `${safeWorkflow.InstanceID}${isMockData ? " (MOCK)" : ""}`,
                  size: "small",
                  color: isMockData ? "attention" : "dark",
                },
              ],
            },
          ],
          spacing: "small",
        },
        {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              width: "auto",
              items: [{ type: "TextBlock", text: "Created By:", weight: "bolder", size: "small", color: "dark" }],
            },
            {
              type: "Column",
              width: "stretch",
              items: [{ type: "TextBlock", text: safeWorkflow.CreatedByName, size: "small", color: "dark" }],
            },
          ],
          spacing: "small",
        },
        {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              width: "auto",
              items: [{ type: "TextBlock", text: "Created On:", weight: "bolder", size: "small", color: "dark" }],
            },
            {
              type: "Column",
              width: "stretch",
              items: [{ type: "TextBlock", text: formattedDate, size: "small", color: "dark" }],
            },
          ],
          spacing: "small",
        },
      ],
      style: "emphasis",
      spacing: "medium",
    })

    if (documentType !== "N/A" || companyCode !== "N/A" || amount !== "N/A") {
      cardBody.push({
        type: "Container",
        items: [
          { type: "TextBlock", text: "Task Details:", weight: "bolder", size: "small", color: "dark" },
          { type: "TextBlock", text: `Document Type: ${documentType}`, size: "small", color: "dark", spacing: "small" },
          { type: "TextBlock", text: `Company Code: ${companyCode}`, size: "small", color: "dark", spacing: "small" },
          { type: "TextBlock", text: `Amount: ${amount}`, size: "small", color: "dark", spacing: "small" },
        ],
        spacing: "medium",
      })
    }

    // Use VERCEL_URL for the callback endpoint
    const actionEndpoint = `https://${process.env.VERCEL_URL}/api/process-action`

    const card = {
      type: "AdaptiveCard",
      body: cardBody,
      actions: [
        {
          type: "Action.Http",
          title: isMockData ? "✓ Mock Approve" : "✓ Approve",
          method: "POST",
          url: actionEndpoint,
          body: JSON.stringify({ action: "approve", instanceId: safeWorkflow.InstanceID }),
          headers: { "Content-Type": "application/json" },
        },
        {
          type: "Action.Http",
          title: isMockData ? "✗ Mock Reject" : "✗ Reject",
          method: "POST",
          url: actionEndpoint,
          body: JSON.stringify({ action: "reject", instanceId: safeWorkflow.InstanceID }),
          headers: { "Content-Type": "application/json" },
        },
        {
          type: "Action.OpenUrl",
          title: isMockData ? "👁 Mock SAP Inbox" : "👁 View in SAP Inbox",
          url: safeWorkflow.InboxURL,
        },
      ],
      msteams: {
        entities: [
          {
            type: "mention",
            text: "<at>channel</at>",
            mentioned: { id: "channel", name: "General" },
          },
        ],
      },
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      version: "1.3",
    }

    return card
  } catch (error) {
    console.error("Error in createIndividualApprovalCard:", error.message, error.stack)
    return {
      type: "AdaptiveCard",
      body: [
        { type: "TextBlock", text: "Error displaying workflow details", weight: "bolder", color: "attention" },
        { type: "TextBlock", text: `Error: ${error.message}`, size: "small", wrap: true },
      ],
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      version: "1.3",
    }
  }
}

export { approveWorkflow, rejectWorkflow, createIndividualApprovalCard }
