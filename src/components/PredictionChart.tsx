import { useState } from "react";
import { ClipLoader } from "react-spinners";
import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import usePrediction from "../hooks/usePrediction";
import CustomTick, { formatDate, formatTime } from "../helper/format";

interface Props {
  handleOnClick: (timestamp: string) => void;
}

const PredictionChart = ({ handleOnClick }: Props) => {
  const [timestamp, setTimestamp] = useState("");

  const { data: prediction, error, isLoading } = usePrediction("pred");
  const { data: real } = usePrediction("real");
  // console.log(prediction?.data?.data_value);
  // console.log(real?.data?.data_value);

  const data =
    prediction?.data?.data_value &&
    Object.entries(prediction?.data?.data_value).map(
      ([timestamp, prediction]) => ({
        timestamp,
        prediction: (prediction as number) >= 0.5 ? 0 : 1, // Interchanging zeros and ones
      })
    );

  const realData =
    real?.data?.data_value &&
    Object.entries(real?.data?.data_value).map(
      ([true_timestamp, prediction]) => ({
        true_timestamp,
        true_prediction: (prediction as number) === 0 ? 1 : 0, // Interchanging zeros and ones
      })
    );

  const realDataMap = new Map(
    realData?.map((item: any) => [item.true_timestamp, item.true_prediction])
  );

  const combinedData = data?.map((item: any) => {
    const truePrediction = realDataMap?.get(item.timestamp); // Fallback to null if no match
    return {
      ...item,
      truePrediction,
    };
  });

  // console.log(combinedData);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const formattedTime = formatTime(label);
      const formattedDate = formatDate(label);
      return (
        <div
          className="custom-tooltip"
          style={{
            backgroundColor: "#fff",
            padding: "10px",
            border: "1px solid #ccc",
          }}
        >
          <p>{`${formattedDate} ${formattedTime}`}</p>
          {payload[0].value == 1 ? ( // One signifies Anomaly
            <p className="text-red-600">Anomaly</p>
          ) : (
            // Zero signifies Anomaly
            <p className="text-green-500">Normal</p>
          )}
        </div>
      );
    }

    return null;
  };

  const handleClick = (data: any) => {
    if (data && data.activePayload[0].payload.prediction === 1) {
      handleOnClick(data.activePayload[0].payload.timestamp);
    }
    handleOnClick(data.activePayload[0].payload.timestamp);
    setTimestamp(data.activePayload[0].payload.timestamp);
  };

  return (
    <>
      <div className="mb-6 bg-white pt-6 pb-6 shadow-lg rounded-lg">
        <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
          Prediction Graph
        </label>
        <div className="overflow-x-scroll mb-4">
          {error && <p className="text-red-600">{error.message}</p>}
          {isLoading ? (
            <div className="w-full h-[100px] flex justify-center items-center">
              <ClipLoader />
            </div>
          ) : (
            <LineChart
              width={12000}
              height={150}
              data={combinedData}
              // data={data}
              onClick={handleClick}
              className="mt-3 mb-3"
            >
              <XAxis dataKey="timestamp" tick={<CustomTick />} />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="prediction" stroke="#8884d8" />
              <Line type="monotone" dataKey="truePrediction" stroke="maroon" />
            </LineChart>
          )}
        </div>
        <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
          Click on a Timestamp for Explanation
        </label>
        <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
          {timestamp !== "" && (
            <p>
              Selected Timestamp: {formatDate(timestamp)},{" "}
              {formatTime(timestamp)}
            </p>
          )}
        </label>
      </div>
    </>
  );
};

export default PredictionChart;
