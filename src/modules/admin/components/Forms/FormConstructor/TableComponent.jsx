// TableComponent.jsx

import React, { useState } from 'react';
import { FaTrashAlt, FaPlusCircle, FaFileExport } from 'react-icons/fa';
import FormulaEditor from './FormulaEditor';
import { getSubjectName, getRowName } from './utils';
import * as XLSX from 'xlsx'; // Import XLSX for export functionality

const TableComponent = ({
  table,
  tableIndex,
  subjectList,
  selectedSubject,
  setSelectedSubject,
  selectedOperation,
  formulaInput,
  setFormulaInput,
  addRow,
  addColumn,
  deleteRow,
  deleteColumn,
  updateColumnName,
  visibleSubTables,
  setVisibleSubTables,
  objectsList,
  selectedObjects,
  setSelectedObjects,
  updateCellOperation,
  allObjects,
}) => {
  // State to track expanded cells
  const [expandedCells, setExpandedCells] = useState({});

  // Function to check if a sub-table for a subject is visible
  const isSubTableVisible = (uniqueKey) => {
    return visibleSubTables[uniqueKey];
  };

  // Toggle visibility for each subject
  const toggleSubTableVisibility = (uniqueKey) => {
    setVisibleSubTables((prev) => ({
      ...prev,
      [uniqueKey]: !prev[uniqueKey],
    }));
  };

  // Toggle expanded state for a specific cell
  const toggleExpanded = (tableIdx, rowIdx, colIdx) => {
    const key = `${tableIdx}-${rowIdx}-${colIdx}`;
    setExpandedCells((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleObjectToggle = (objId) => {
    setSelectedObjects((prevSelectedObjects) =>
      prevSelectedObjects.includes(objId)
        ? prevSelectedObjects.filter((id) => id !== objId) // Remove unchecked object
        : [...prevSelectedObjects, objId] // Add checked object
    );
  };

  // Function to export individual subject table to Excel
  const exportSubjectToExcel = (subjectItem) => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    // Header row
    const header = ['Дата'];
    if (table.groupByHour) {
      header.push('Час');
    }
    header.push('Субъект');
    subjectItem.data.forEach((res) => {
      header.push(res.name);
    });
    wsData.push(header);

    // Data rows
    if (subjectItem.data[0]?.date_value?.length > 0) {
      // Merge date_value arrays
      const dateValueMap = {};
      subjectItem.data.forEach((res) => {
        res.date_value.forEach((dateItem) => {
          const date = dateItem.date;
          const value = dateItem.value;
          if (!dateValueMap[date]) {
            dateValueMap[date] = {};
          }
          if (Array.isArray(value)) {
            // value is an array of hours
            value.forEach((hourItem) => {
              const hour = hourItem.hour;
              if (!dateValueMap[date][hour]) {
                dateValueMap[date][hour] = {};
              }
              dateValueMap[date][hour][res.name] = hourItem.value;
            });
          } else {
            // value is a single number
            dateValueMap[date][res.name] = value;
          }
        });
      });

      Object.keys(dateValueMap).forEach((date) => {
        if (table.groupByHour) {
          Object.keys(dateValueMap[date]).forEach((hour) => {
            const row = [
              date,
              hour,
              getRowName(subjectList, allObjects, subjectItem.subject, subjectItem.objects),
            ];
            subjectItem.data.forEach((res) => {
              const value = dateValueMap[date][hour][res.name];
              row.push(value !== null && value !== undefined ? value : '-');
            });
            wsData.push(row);
          });
        } else {
          const row = [
            date,
            getRowName(subjectList, allObjects, subjectItem.subject, subjectItem.objects),
          ];
          subjectItem.data.forEach((res) => {
            const value = dateValueMap[date][res.name];
            row.push(value !== null && value !== undefined ? value : '-');
          });
          wsData.push(row);
        }
      });
    } else {
      // If no date_value, add a single row
      const row = [
        table.startDate || '-',
        getRowName(subjectList, allObjects, subjectItem.subject, subjectItem.objects),
      ];
      subjectItem.data.forEach((res) => {
        const value = res.value;
        row.push(value !== null && value !== undefined ? value : '-');
      });
      wsData.push(row);
    }

    // Create worksheet and add to workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    let sheetName = `${table.name}_${getSubjectName(
      subjectList,
      subjectItem.subject
    )}`;

    // Ensure sheet name does not exceed 31 characters
    if (sheetName.length > 31) {
      sheetName = sheetName.substring(0, 31);
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Save to file
    XLSX.writeFile(wb, `${sheetName}.xlsx`);
  };

  return (
    <div className="mb-10">
      {/* Table Name Input */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-1">Название таблицы:</label>
        <input
          type="text"
          value={table.name}
          onChange={(e) => updateColumnName(tableIndex, 'name', e.target.value)}
          className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Global Date Inputs */}
      <div className="flex space-x-6 mb-6">
        <div className="w-1/2">
          <label className="block text-gray-700 mb-1">Дата начала</label>
          <input
            type="date"
            value={table.startDate}
            onChange={(e) =>
              updateColumnName(tableIndex, 'startDate', e.target.value)
            }
            className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-1/2">
          <label className="block text-gray-700 mb-1">Дата окончания</label>
          <input
            type="date"
            value={table.endDate}
            onChange={(e) =>
              updateColumnName(tableIndex, 'endDate', e.target.value)
            }
            className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Group By Options */}
      <div className="flex items-center space-x-6 mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={table.groupByDate}
            onChange={(e) =>
              updateColumnName(tableIndex, 'groupByDate', e.target.checked)
            }
            className="mr-2"
          />
          Группировать по дате
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={table.groupByHour}
            onChange={(e) =>
              updateColumnName(tableIndex, 'groupByHour', e.target.checked)
            }
            className="mr-2"
          />
          Группировать по часу
        </label>
      </div>

      {/* Exclude Holidays Options */}
      <div className="mb-6">
        <label className="block text-gray-700 mb-1">Исключить праздничные дни:</label>
        <div className="flex items-center space-x-6">
          {['Russia', 'Kazakhstan', 'Weekend'].map((country) => (
            <label key={country} className="flex items-center">
              <input
                type="checkbox"
                checked={table.excludeHolidays[country]}
                onChange={(e) =>
                  updateColumnName(tableIndex, 'excludeHolidays', {
                    ...table.excludeHolidays,
                    [country]: e.target.checked,
                  })
                }
                className="mr-2"
              />
              {country}
            </label>
          ))}
        </div>
      </div>

      {/* Add Row Section */}
      <div className="mb-6 space-x-4 flex items-center">
        <label className="block text-gray-700">Выберите субъект:</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Выберите субъект</option>
          {subjectList.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.subject_name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {objectsList.map((obj) => (
            <div key={obj.id} className="flex items-center">
              <input
                type="checkbox"
                id={`object-${obj.id}`}
                checked={selectedObjects.includes(obj.id)}
                onChange={() => handleObjectToggle(obj.id)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor={`object-${obj.id}`}
                className="ml-3 text-gray-700"
              >
                {obj.object_name}
              </label>
            </div>
          ))}
        </div>
        <button
          onClick={() => addRow(tableIndex)}
          className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center space-x-1"
        >
          <FaPlusCircle className="mr-1" />
          <span>Добавить строку</span>
        </button>
      </div>

      {/* Add Column Section */}
      <div className="mb-6 space-x-4 flex items-center">
        {selectedOperation === "formula" && (
          <div className="flex items-center space-x-4">
            <label className="block text-gray-700">Введите формулу:</label>
            <FormulaEditor value={formulaInput} onChange={setFormulaInput} />
          </div>
        )}

        <button
          onClick={() => addColumn(tableIndex)}
          className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-1"
        >
          <FaPlusCircle className="mr-1" />
          <span>Добавить колонку</span>
        </button>
      </div>

      {/* Main Table Structure */}
      <h2 className="text-lg font-semibold mb-4">Основная таблица</h2>
      <div className="overflow-x-auto max-w-full mb-6">
        <table className="min-w-full bg-white border border-gray-200 shadow-md table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                Субъекты
              </th>
              {table.tableConfig.length > 0 &&
                table.tableConfig[0].data.map((res, index) => (
                  <th
                    key={res.id}
                    className="px-2 py-1 text-left text-gray-700 font-semibold border-b"
                  >
                    <input
                      type="text"
                      value={res.name}
                      onChange={(e) =>
                        updateColumnName(tableIndex, index, e.target.value)
                      }
                      className="border border-gray-300 rounded-md p-1 focus:ring-2 focus:ring-blue-500"
                      style={{ width: "100px" }}
                    />
                    <button
                      className="ml-2 text-red-500 hover:text-red-700 flex items-center"
                      onClick={() => deleteColumn(tableIndex, index)}
                    >
                      <FaTrashAlt className="mr-1" />
                      <span>Удалить</span>
                    </button>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {table.tableConfig.map((item, rowIndex) => (
              <React.Fragment key={`${tableIndex}-${rowIndex}`}>
                <tr className="hover:bg-gray-50">
                  <td className="border px-2 py-1 text-gray-600">
                    {getRowName(subjectList, allObjects, item.subject, item.objects)}
                    <button
                      className="ml-2 text-red-500 hover:text-red-700 flex items-center"
                      onClick={() => deleteRow(tableIndex, rowIndex)}
                    >
                      <FaTrashAlt className="mr-1" />
                      <span>Удалить</span>
                    </button>
                  </td>
                  {item.data.map((res, colIndex) => (
                    <td key={`${tableIndex}-${rowIndex}-${colIndex}`} className="border px-2 py-1 text-gray-600">
                      {table.groupByDate || table.groupByHour ? (
                        '-'
                      ) : Array.isArray(res.value) ? (
                        <div>
                          <button
                            className="text-blue-500 underline"
                            onClick={() => toggleExpanded(tableIndex, rowIndex, colIndex)}
                          >
                            {expandedCells[`${tableIndex}-${rowIndex}-${colIndex}`]
                              ? 'Скрыть массив'
                              : 'Показать массив'}
                          </button>
                          {expandedCells[`${tableIndex}-${rowIndex}-${colIndex}`] && (
                            <span className="mt-2 block">
                              {res.value.join(', ')}
                            </span>
                          )}
                        </div>
                      ) : (
                        res.value !== null && res.value !== undefined ? res.value : '-'
                      )}
                    </td>
                  ))}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Subject-Specific Tables */}
      {table.groupByDate || table.groupByHour ? (
        <>
          <h2 className="text-lg font-semibold mb-4">Таблицы по субъектам</h2>
          {table.tableConfig.map((item) => {
            // Unique key combining subject and objects
            const uniqueKey = `${item.subject}_${item.objects.join(',')}`;
            return (
              <div key={uniqueKey} className="mb-6">
                <div className="flex items-center space-x-4 mb-2">
                  <button
                    onClick={() => toggleSubTableVisibility(uniqueKey)}
                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-1"
                  >
                    {isSubTableVisible(uniqueKey)
                      ? `Скрыть данные для ${getRowName(subjectList, allObjects, item.subject, item.objects)}`
                      : `Показать данные для ${getRowName(subjectList, allObjects, item.subject, item.objects)}`}
                  </button>
                  <button
                    onClick={() => exportSubjectToExcel(item)}
                    className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center space-x-1"
                  >
                    <FaFileExport className="mr-1" />
                    <span>Экспортировать</span>
                  </button>
                </div>

                {isSubTableVisible(uniqueKey) && (
                  <div className="overflow-x-auto mt-4">
                    {item.data[0]?.date_value?.length > 0 ? (
                      <div className="mb-4">
                        <table className="min-w-full bg-white border border-gray-200 shadow-md table-auto">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                                Дата
                              </th>
                              {table.groupByHour && (
                                <th className="px-2 py-1 text-left text-gray-700 font-semibold border-b">
                                  Час
                                </th>
                              )}
                              {item.data.map((res, colIdx) => (
                                <th
                                  key={colIdx}
                                  className="px-2 py-1 text-left text-gray-700 font-semibold border-b"
                                >
                                  {res.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Prepare data for display */}
                            {(() => {
                              const dateValueMap = {};
                              item.data.forEach((res) => {
                                res.date_value.forEach((dateItem) => {
                                  const date = dateItem.date;
                                  const value = dateItem.value;
                                  if (!dateValueMap[date]) {
                                    dateValueMap[date] = {};
                                  }
                                  if (Array.isArray(value)) {
                                    // value is an array of hours
                                    value.forEach((hourItem) => {
                                      const hour = hourItem.hour;
                                      if (!dateValueMap[date][hour]) {
                                        dateValueMap[date][hour] = {};
                                      }
                                      dateValueMap[date][hour][res.name] = hourItem.value;
                                    });
                                  } else {
                                    // value is a single number
                                    dateValueMap[date][res.name] = value;
                                  }
                                });
                              });

                              const rows = [];
                              Object.keys(dateValueMap).forEach((date) => {
                                if (table.groupByHour) {
                                  const hours = Object.keys(dateValueMap[date]);
                                  hours.forEach((hour, hourIdx) => {
                                    rows.push(
                                      <tr key={`${date}-${hour}`} className="hover:bg-gray-50">
                                        {hourIdx === 0 && (
                                          <td
                                            rowSpan={hours.length}
                                            className="border px-2 py-1 text-gray-600 w-32"
                                          >
                                            {date}
                                          </td>
                                        )}
                                        <td className="border px-2 py-1 text-gray-600">
                                          {hour}
                                        </td>
                                        {item.data.map((res, resIdx) => (
                                          <td key={resIdx} className="border px-2 py-1 text-gray-600">
                                            {dateValueMap[date][hour][res.name] !== null && dateValueMap[date][hour][res.name] !== undefined
                                              ? dateValueMap[date][hour][res.name]
                                              : '-'}
                                          </td>
                                        ))}
                                      </tr>
                                    );
                                  });
                                } else {
                                  rows.push(
                                    <tr key={`${date}`} className="hover:bg-gray-50">
                                      <td className="border px-2 py-1 text-gray-600">
                                        {date}
                                      </td>
                                      {item.data.map((res, resIdx) => (
                                        <td key={resIdx} className="border px-2 py-1 text-gray-600">
                                          {dateValueMap[date][res.name] !== null && dateValueMap[date][res.name] !== undefined
                                            ? dateValueMap[date][res.name]
                                            : '-'}
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                }
                              });
                              return rows;
                            })()}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div>Нет данных для отображения</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      ) : null}
    </div>
  );
};

export default TableComponent;
