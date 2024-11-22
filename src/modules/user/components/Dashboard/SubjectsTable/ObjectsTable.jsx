// src/components/Dashboard/ObjectsTable/ObjectTable.js
import React, { useState, useEffect } from 'react';
import { axiosInstance, endpoints } from '../../../../../services/apiConfig';
import useDataFetching from '../../../../../hooks/useDataFetching';
import CreatePlanModal from '../CreatePlanModal/CreatePlanModal';

const timeIntervals = [
  '00 - 01', '01 - 02', '02 - 03', '03 - 04', '04 - 05', '05 - 06',
  '06 - 07', '07 - 08', '08 - 09', '09 - 10', '10 - 11', '11 - 12',
  '12 - 13', '13 - 14', '14 - 15', '15 - 16', '16 - 17', '17 - 18',
  '18 - 19', '19 - 20', '20 - 21', '21 - 22', '22 - 23', '23 - 00',
];

const ObjectTable = ({ selectedData, setSelectedData, objectsList, selectedDate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectedObject = objectsList.find(object => object.id === selectedData.selectedObject);

  const { daysList, hoursList } = useDataFetching(selectedDate, selectedData.selectedObject, 'object');

  const dayPlan = daysList?.find(day => day.object === selectedObject?.id && day.date.split('T')[0] === selectedDate.split('T')[0]);
  const hourPlan = hoursList?.filter(hour => hour.day === dayPlan?.id);

  const [planData, setPlanData] = useState({
    planMode: 'P1',
    isGen: false,
  });

  // State Variables for Status Management
  const [statusMap, setStatusMap] = useState({});
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [statusError, setStatusError] = useState(null);

  // Asynchronous Function to Fetch Status
  const getPlanStatus = async (date, object) => {
    try {
      const response = await axiosInstance.get(endpoints.GET_STATUS, {
        params: {
          date,
          object: object.id,
        },
      });
      return response.data || {};
    } catch (error) {
      console.error(`Error fetching status for object ${object.id}:`, error);
      return {};
    }
  };

  // Fetch All Statuses When selectedDate or objectsList Change
  useEffect(() => {
    const fetchAllStatuses = async () => {
      setLoadingStatuses(true);
      setStatusError(null);
      const newStatusMap = {};

      try {
        const statusPromises = objectsList.map((object) =>
          getPlanStatus(selectedDate, object).then((statuses) => ({
            id: object.id,
            statuses,
          }))
        );

        const statuses = await Promise.all(statusPromises);

        statuses.forEach(({ id, statuses }) => {
          newStatusMap[id] = statuses;
        });

        setStatusMap(newStatusMap);
      } catch (error) {
        setStatusError("Ошибка при загрузке статусов.");
        console.error("Error fetching statuses:", error);
      } finally {
        setLoadingStatuses(false);
      }
    };

    if (selectedDate && objectsList.length > 0) {
      fetchAllStatuses();
    }
  }, [selectedDate, objectsList]);

  // Function to generate status display string
  const generateStatusDisplayString = (statuses) => {
    if (!statuses || Object.keys(statuses).length === 0) {
      return "Нет данных";
    }

    const statusKeys = [
      'P1_Status', 'P1_Gen_Status', 'P2_Status', 'P2_Gen_Status', 'P3_Status', 'P3_Gen_Status',
      'F1_Status', 'F1_Gen_Status', 'F2_Status', 'F2_Gen_Status'
    ];

    const statusAbbreviations = {
      'P1_Status': 'П1',
      'P1_Gen_Status': 'ГП1',
      'P2_Status': 'П2',
      'P2_Gen_Status': 'ГП2',
      'P3_Status': 'П3',
      'P3_Gen_Status': 'ГП3',
      'F1_Status': 'Ф1',
      'F1_Gen_Status': 'ГФ1',
      'F2_Status': 'Ф2',
      'F2_Gen_Status': 'ГФ2',
    };

    let displayString = '';

    statusKeys.forEach(key => {
      if (statuses[key] === 'COMPLETED') {
        displayString += '-' + statusAbbreviations[key] + '-';
      }
    });

    if (!displayString) {
      displayString = 'Нет данных';
    }

    return displayString;
  };

  // Filter Objects Based on Selected Subject
  const objects = objectsList.filter(object => object.subject === selectedData.selectedSubject);

  // Set Default Selected Object if Not Already Selected
  useEffect(() => {
    if (!selectedData.selectedObject && objects.length > 0) {
      setSelectedData(prevData => ({
        ...prevData,
        selectedObject: objects[0]?.id || 0,
      }));
    }
  }, [selectedData.selectedSubject, objects, setSelectedData]);

  return (
    <>
      {/* Status Table */}
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th>{'Объект'}</th>
            {objects.map(object => (
              <th key={object.id}>{object.object_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border" scope="row">Статус</td>
            {objects.map(object => (
              <td
                key={object.id}
                className={`border hover:bg-blue-100 cursor-pointer ${selectedData.selectedObject === object.id ? 'bg-blue-500 text-white' : ''}`}
                onClick={() => setSelectedData(prevData => ({
                  ...prevData,
                  selectedObject: object.id,
                }))}
              >
                {loadingStatuses ? (
                  "Загрузка..."
                ) : statusError ? (
                  statusError
                ) : (
                  generateStatusDisplayString(statusMap[object.id])
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* Plan Tables */}
      <table className="w-full text-sm text-center text-gray-500 mb-3">
        <thead className="text-xs text-gray-700 uppercase bg-gray-300">
          <tr>
            <th></th>
            <th>
              П1
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    planMode: 'P1',
                    isGen: false,
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedObject?.object_type === 'ЭПО' && (
              <th>
                ГП1
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: 'GP1',
                      isGen: true,
                    });
                  }}
                >
                  📝
                </button>
              </th>
            )}
            <th>
              П2
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    planMode: 'P2',
                    isGen: false,
                  });
                }}
              >
                  📝
              </button>
            </th>
            {selectedObject?.object_type === 'ЭПО' && (
              <th>
                ГП2
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: 'GP2',
                      isGen: true,
                    });
                  }}
                >
                  📝
                </button>
              </th>
            )}
            <th>
              П3
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    planMode: 'P3',
                    isGen: false,
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedObject?.object_type === 'ЭПО' && (
              <th>
                ГП3
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: 'GP3',
                      isGen: true,
                    });
                  }}
                >
                  📝
                </button>
              </th>
            )}
            <th>
              Ф1
              <button
                className="text-base mx-1"
                onClick={() => {
                  setIsModalOpen(true);
                  setPlanData({
                    planMode: 'F1',
                    isGen: false,
                  });
                }}
              >
                📝
              </button>
            </th>
            {selectedObject?.object_type === 'ЭПО' && (
              <th>
                ГФ1
                <button
                  className="text-base mx-1"
                  onClick={() => {
                    setIsModalOpen(true);
                    setPlanData({
                      planMode: 'GF1',
                      isGen: true,
                    });
                  }}
                >
                  📝
                </button>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {timeIntervals.map((time, index) => (
            <tr key={time}>
              <td className="border">{time}</td>
              <td className="border">{hourPlan?.[index]?.P1 || 0}</td>
              {selectedObject?.object_type === 'ЭПО' && <td className="border">{hourPlan?.[index]?.P1_Gen || 0}</td>}
              <td className="border">{hourPlan?.[index]?.P2 || 0}</td>
              {selectedObject?.object_type === 'ЭПО' && <td className="border">{hourPlan?.[index]?.P2_Gen || 0}</td>}
              <td className="border">{hourPlan?.[index]?.P3 || 0}</td>
              {selectedObject?.object_type === 'ЭПО' && <td className="border">{hourPlan?.[index]?.P3_Gen || 0}</td>}
              <td className="border">{hourPlan?.[index]?.F1 || 0}</td>
              {selectedObject?.object_type === 'ЭПО' && <td className="border">{hourPlan?.[index]?.F1_Gen || 0}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Create Plan Modal */}
      <CreatePlanModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        selectedObject={selectedObject}
        objectList={objectsList}
        plans={hourPlan}
        planMode={planData.planMode}
        isGen={planData.isGen}
      />
    </>
  );
};

export default ObjectTable;
