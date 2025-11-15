export async function getLatestData() {
    const response = await fetch(
        `https://u4830dkpl0.execute-api.eu-central-1.amazonaws.com/prod/data/latest-data?deviceId=${ process.env.HARVIA_DEVICE_ID }`,
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ process.env.HARVIA_API_KEY }`
            }
        }
    );
    return response;
}