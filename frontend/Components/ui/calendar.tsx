"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar p-4 [--cell-size:2.5rem] bg-white",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "h-8 w-8 p-0 hover:bg-gray-100 rounded-md",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "h-8 w-8 p-0 hover:bg-gray-100 rounded-md",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-10 w-full px-10",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-10 gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative border-0",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium text-gray-900 text-base",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse border-spacing-0",
        weekdays: cn("flex mb-2", defaultClassNames.weekdays),
        weekday: cn(
          "text-gray-500 rounded-md flex-1 font-medium text-sm select-none h-10 flex items-center justify-center",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-10",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-sm select-none text-gray-400",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center group/day aspect-square select-none",
          defaultClassNames.day
        ),
        range_start: cn(
          "bg-transparent",
          defaultClassNames.range_start
        ),
        range_middle: cn("bg-transparent", defaultClassNames.range_middle),
        range_end: cn("bg-transparent", defaultClassNames.range_end),
        today: cn(
          "bg-green-500 text-white rounded-md font-medium",
          defaultClassNames.today
        ),
        outside: cn(
          "text-gray-300",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-gray-200 opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4 text-gray-600", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4 text-gray-600", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4 text-gray-600", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex w-10 h-10 items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        // Base styles
        "h-10 w-10 p-0 font-normal text-gray-900 hover:bg-gray-50 rounded-md border-0 shadow-none",
        // Today styling
        modifiers.today && "bg-green-500 text-white font-medium hover:bg-green-600",
        // Selected styling
        "data-[selected-single=true]:bg-blue-500 data-[selected-single=true]:text-white data-[selected-single=true]:font-medium",
        // Range styling
        "data-[range-start=true]:bg-blue-500 data-[range-start=true]:text-white data-[range-start=true]:font-medium",
        "data-[range-end=true]:bg-blue-500 data-[range-end=true]:text-white data-[range-end=true]:font-medium",
        "data-[range-middle=true]:bg-blue-100 data-[range-middle=true]:text-blue-900",
        // Outside month styling
        modifiers.outside && "text-gray-300 hover:text-gray-400",
        // Disabled styling
        modifiers.disabled && "text-gray-200 hover:bg-transparent cursor-not-allowed",
        // Focus styling
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }