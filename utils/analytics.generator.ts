import { Document, Model } from "mongoose";

// Interface to define the structure of the last 12 months data
interface MonthData {
    month: string;
    count: number;
}

// Function to generate last 12 months' data
export async function generateLast12MonthsData<T extends Document>(
    model: Model<T>
): Promise<{ last12Months: MonthData[] }> {
    const last12Months: MonthData[] = [];

    // Create a new Date object for the current date
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);  // Adjust current date to avoid issues

    // Loop through the last 12 months
    for (let i = 11; i >= 0; i--) {
        // Set end date for the current month in the loop
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - (i * 28));

        // Set start date for the current month in the loop
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 28);

        // Format the month and year to a readable string (e.g., "Nov 2023")
        const monthYear = endDate.toLocaleString('default', {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        // Count the number of documents in the current month range
        const count = await model.countDocuments({
            createdAt: {
                $gte: startDate,  // Greater than or equal to start date
                $lt: endDate      // Less than end date
            }
        });

        // Push the month and count into the array
        last12Months.push({ month: monthYear, count });
    }

    // Return the array of the last 12 months' data
    return { last12Months };
}
