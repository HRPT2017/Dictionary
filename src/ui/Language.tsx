import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as wanakana from "wanakana";
import {
  Table,
  TableHead,
  TableBody,
  TableHeadCell,
  TableCell,
  TableRow,
  Button,
  TextInput,
  Label,
  Pagination,
  Modal,
  ModalHeader,
  ModalBody,
  Toast,
} from "flowbite-react";
import supabase from "../utils/supabase";
import { v4 as uuid } from "uuid";
import { FiEdit3 } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi";
import { FaRegCircleXmark } from "react-icons/fa6";
import { TbPlaylistAdd, TbTablePlus } from "react-icons/tb";
import { FaRegSave } from "react-icons/fa";
import { saveFile, readFile } from "../utils/fileSystem";
import { createRoot } from "react-dom/client";

type Data = {
  id: string;
  kanji: string;
  reading: { kana: string; romaji: string }[];
  meaning: string;
};

export default function Language(page: string) {
  const [input, setInput] = useState("");
  const [reading, setReading] = useState<{ kana: string; romaji: string }[]>([
    { kana: "", romaji: "" },
  ]);
  const [meaning, setMeaning] = useState("");
  const [rows, setRows] = useState<Data[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const entriesPerPage = 10;
  const totalPages = Math.ceil(rows.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const [search, setSearch] = useState("");
  const filtered = rows.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase()),
  );
  const currentRows = filtered.slice(startIndex, startIndex + entriesPerPage);
  const [editing, setEditing] = useState(false);
  const [tempData, setTempData] = useState<Data>();
  const [deleting, setDeleting] = useState({ id: "", state: false });
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<(HTMLLIElement | null)[]>([]);
  const isOnline = navigator.onLine;

  let filename = "";
  if (page === "kanji") {
    filename = "kanji_data.json";
  } else {
    filename = "vocab_data.json";
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = wanakana.toKana(e.target.value, { IMEMode: true });
    console.log(value, wanakana.toRomaji(value, { IMEMode: true }));
    setInput(value);
    setOpen(value.length > 0);
    setReading([
      { kana: value, romaji: wanakana.toRomaji(value, { IMEMode: true }) },
    ]);
    if (value.length > 0) {
      try {
        const response = await axios.get(
          `https://inputtools.google.com/request?text=${value}&itc=ja-t-ja-hira-i0-und&num=19&cp=0&cs=1&ie=utf-8&oe=utf-8&app=jsapi`,
        );
        const suggestionsData = response.data[1][0][1] as string[];
        setSuggestions(suggestionsData);
      } catch (error) {
        console.error("Error fetching Kanji data:", error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: { key: any; preventDefault: () => void }) => {
    if (!open || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectKanji(suggestions[selectedIndex]);
          setOpen(false);
        }
        break;

      case "Escape":
        setOpen(false);
        break;
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current[selectedIndex]) {
      listRef.current[selectedIndex].scrollIntoView({
        block: "nearest",
      });
    }
  }, [selectedIndex]);
  useEffect(() => {
    const handleClickOutside = (e: { target: any }) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectKanji = async (kanji: string) => {
    setInput(kanji);
    if (page === "vocab") {
      try {
        const response = await axios.get(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=en&dt=t&q=${kanji}`,
        );
        const suggestionsData = response.data[0][0][0] as string;
        setMeaning(suggestionsData);
      } catch (error) {
        console.error("Error fetching Kanji data:", error);
        setSuggestions([]);
      }
    }
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const addReading = () => {
    if (editing === true) {
      const tempUpdated = { ...tempData! };
      tempUpdated.reading = [...tempUpdated.reading, { kana: "", romaji: "" }];
      setTempData(tempUpdated);
    } else {
      setReading([...reading, { kana: "", romaji: "" }]);
    }
  };

  const removeReading = (index: number) => {
    if (editing) {
      const tempUpdated = { ...tempData! };
      tempUpdated.reading = tempUpdated.reading.filter((_, i) => i !== index);
      setTempData(tempUpdated);
    } else {
      setReading(reading.filter((_, i) => i !== index));
    }
  };

  const updateReading = (index: number, value: string) => {
    if (editing) {
      const tempUpdated = { ...tempData! };
      const updated = [...tempUpdated.reading];
      updated[index] = {
        kana: wanakana.toKana(value, { IMEMode: true }),
        romaji: wanakana.toRomaji(value, { IMEMode: true }),
      };
      tempUpdated.reading = updated;
      setTempData(tempUpdated);
    } else {
      const updated = [...reading];
      updated[index] = {
        kana: wanakana.toKana(value, { IMEMode: true }),
        romaji: wanakana.toRomaji(value, { IMEMode: true }),
      };
      setReading(updated);
    }
  };

  const addRow = async () => {
    const checks = [
      { value: input, message: "Missing kanji" },
      { value: meaning, message: "Missing meaning" },
      { value: reading?.[0]?.kana, message: "Missing kana" },
      { value: reading?.[0]?.romaji, message: "Missing romaji" },
    ];

    for (const check of checks) {
      if (!check.value) {
        toast(check.message);
        return;
      }
    }

    const exists = rows.some((row) => row.kanji === input);
    if (exists) {
      toast("This entry already exists!");
      return;
    } else {
      rows.push({ id: uuid(), kanji: input, reading, meaning });
      setInput("");
      setReading([{ kana: "", romaji: "" }]);
      setMeaning("");
      await save(rows);
    }
  };

  const deleteRow = async (id: string) => {
    const file = rows.filter((row) => row.id !== id);
    setRows(file);
    try {
      await save(file);
      await load();
    } catch (err) {
      console.error(" Error saving to supabase:", err);
    }
    setDeleting({ id: "", state: false });
  };

  const save = async (updatedRows: Data[]) => {
    await saveFile(filename, JSON.stringify(updatedRows));
    await window.electronAPI.saveFile(filename, JSON.stringify(updatedRows));
    try {
      await supabase.storage.from("language").upload(
        filename,
        new Blob([JSON.stringify(updatedRows)], {
          type: "application/json",
        }),
        { upsert: true },
      );
    } catch (err) {
      console.error(" Error saving to supabase:", err);
    }
  };

  const loadLocaly = async () => {
    try {
      const result = await readFile(filename);
      let text: string | undefined;

      if (result instanceof Blob) {
        text = await result.text();
      } else {
        text = result;
      }

      if (text) {
        setRows(JSON.parse(text));
      } else {
        console.warn("File is empty");
      }
    } catch (e) {
      console.error("Error reading or parsing file:", e);
    }

    const result = await window.electronAPI.loadFile(filename);
    setRows(JSON.parse(result.data ?? ""));
  };

  const load = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("language")
        .download(filename);
      if (error) {
        loadLocaly();
        return;
      }
      const text = await data.text();
      const json = JSON.parse(text);
      setRows(json);
      await save(json);
    } catch (err) {
      console.error(" Error loading from supabase:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const edit = async () => {
    if (!tempData) return;

    const update = rows.map((row) => (row.id === tempData.id ? tempData : row));
    setRows(update);
    try {
      await save(update);
      await load();
      setEditing(false);
      setTempData(undefined);
    } catch (err) {
      console.error(" Error saving to supabase:", err);
    }
  };

  return (
    <div className="p-2">
      {/* Inputs */}{" "}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_0.5fr] gap-4 mb-4 ${!isOnline ? "pointer-events-none opacity-50" : ""}`}
      >
        <div className="flex flex-col w-full">
          <Label className="w-1/2">Kanji</Label>
          <TextInput
            className="w-full"
            type="text"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />
          <div className="relative" ref={wrapperRef}>
            {open && suggestions.length > 0 && (
              <ul className="absolute bg-white border w-full max-h-40 overflow-y-auto z-10 text-black">
                {suggestions.map((kanji, index) => (
                  <li
                    key={index}
                    ref={(el) => {
                      listRef.current[index] = el;
                    }}
                    onClick={() => {
                      selectKanji(kanji);
                      setOpen(false);
                    }}
                    className={`p-2 cursor-pointer ${
                      index === selectedIndex ? "bg-gray-200" : ""
                    }`}
                  >
                    {kanji}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="flex flex-col w-full">
          <Label className="w-1/2">Meaning</Label>
          <TextInput
            type="text"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            placeholder="Enter Meaning"
            className="w-full"
          />
        </div>
        <div className="flex-col w-full">
          <div className="flex flex-row gap-2 w-full ">
            <Label className="w-full">Kana</Label>
            <Label className="w-full">Romaji</Label>
          </div>
          {reading.map((r, i) => (
            <div key={i} className="flex flex-row gap-2 w-full mb-4">
              <TextInput
                type="text"
                className="w-full"
                placeholder={"Type reading"}
                value={r.kana}
                onChange={(e) => updateReading(i, e.target.value)}
              />
              <TextInput
                className="border-0 w-full"
                value={r.romaji}
                disabled
              />
              {reading.length > 1 && (
                <div className="flex-col w-1/12 mt-4">
                  <FaRegCircleXmark
                    color="red"
                    onClick={() => removeReading(i)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-row gap-2">
          <Button onClick={addReading} className="mt-5">
            <TbPlaylistAdd size={25} />
          </Button>
          <Button onClick={addRow} className="mt-5">
            <TbTablePlus size={20} />
          </Button>
        </div>
      </div>
      {/*Table*/}
      <div className="overflow-x-auto">
        <Table striped className="w-full">
          <TableHead>
            <TableRow>
              <TableHeadCell colSpan={2}>
                <TextInput
                  placeholder="Search..."
                  sizing="sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </TableHeadCell>
              <TableHeadCell></TableHeadCell>
              <TableHeadCell></TableHeadCell>
            </TableRow>
          </TableHead>
          <TableHead>
            <TableRow>
              <TableHeadCell>Kanji</TableHeadCell>
              <TableHeadCell>Meaning</TableHeadCell>
              <TableHeadCell>Reading(s)</TableHeadCell>
              <TableHeadCell></TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentRows?.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="w-1/6">{row.kanji}</TableCell>
                <TableCell className="w-1/3">{row.meaning}</TableCell>
                <TableCell className="w-full">
                  {row.reading.map((r) => `${r.kana} = ${r.romaji}`).join("; ")}
                </TableCell>
                <TableCell className="flex flex-row">
                  {editing ? (
                    <></>
                  ) : (
                    <>
                      <HiOutlineTrash
                        onClick={() => setDeleting({ id: row.id, state: true })}
                        color="red"
                        size={20}
                      />
                      <FiEdit3
                        onClick={() => (setEditing(true), setTempData(row))}
                        className="ml-4"
                        size={20}
                      />
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Edit Modal */}
      {editing && tempData && (
        <Modal
          size="5xl"
          show={editing}
          popup
          onClose={() => (setEditing(false), setTempData(undefined))}
        >
          <ModalHeader />
          <ModalBody>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_0.5fr] gap-4 mb-4">
                <div className="flex flex-col">
                  <Label className="w-1/3">Kanji</Label>
                  <Label className="w-1/3">{tempData!.kanji}</Label>
                </div>
                <div className="flex flex-col">
                  <Label className="w-full">Meaning</Label>
                  <TextInput
                    type="text"
                    value={tempData!.meaning}
                    onChange={(e) =>
                      setTempData({
                        ...tempData!,
                        meaning: e.target.value,
                      })
                    }
                    placeholder="Enter Meaning"
                    className="w-full"
                  />
                </div>
                <div className="flex-col gap-2 w-full">
                  <div className="flex flex-row">
                    {" "}
                    <Label className="w-full">Kana:</Label>
                    <Label className="w-full">Romaji:</Label>
                  </div>
                  {tempData!.reading.map((r, i) => (
                    <div key={i} className="flex flex-row gap-2 w-full mb-2">
                      <TextInput
                        className="w-full"
                        type="text"
                        placeholder={"Type reading"}
                        value={r.kana}
                        onChange={(e) => updateReading(i, e.target.value)}
                      />
                      <TextInput
                        className="border-0 w-full"
                        value={r.romaji}
                        disabled
                      />
                      {tempData!.reading.length > 1 && (
                        <div className="flex-col w-1/12 mt-4">
                          <FaRegCircleXmark
                            color="red"
                            onClick={() => removeReading(i)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <br />
                </div>
                <div className="flex flex-col">
                  <Button onClick={addReading} className="mt-5">
                    <TbPlaylistAdd size={25} />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_0.5fr] gap-4 mb-4">
                <Button
                  onClick={edit}
                  className="w-1/2 bg-green-500 text-white hover:bg-green-600 focus:ring-green-200 dark:bg-green-400 dark:hover:bg-green-600 dark:focus:ring-green-700"
                >
                  <FaRegSave className="mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </ModalBody>
        </Modal>
      )}
      {/*Delete Modal*/}
      {deleting.state && (
        <Modal
          size="xl"
          show={deleting.state}
          className="bg-blue"
          popup
          onClose={() => setDeleting({ id: "", state: false })}
        >
          <ModalHeader />
          <ModalBody>
            <div className="flex flex-col text-center">
              <div className="mb-4">
                Are you sure you want to delete this entry?
              </div>
              <div className="flex flex-row justify-center gap-4">
                <Button
                  color="red"
                  onClick={() => deleteRow(deleting.id)}
                  className="w-1/6"
                >
                  Delete
                </Button>
                <Button
                  onClick={() => setDeleting({ id: "", state: false })}
                  className="w-1/6"
                >
                  No
                </Button>
              </div>
            </div>
          </ModalBody>
        </Modal>
      )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showIcons
          />
        </div>
      )}
    </div>
  );
}

function toast(message: string, duration = 2000) {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const root = createRoot(container);

  const ToastComponent = () => (
    <div className="fixed bottom-5 right-5 z-50">
      <Toast>
        <div className="text-md font-bold text-red-700">{message}</div>
      </Toast>
    </div>
  );

  root.render(<ToastComponent />);

  setTimeout(() => {
    root.unmount();
    container.remove();
  }, duration);
}
