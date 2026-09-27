import { useState, useRef } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { Download, Printer, ArrowLeft, CheckCircle } from '@phosphor-icons/react'
import { Project } from '@/lib/types'
import { format } from 'date-fns'

interface ConstructionAgreementProps {
  project: Project
  onBack: () => void
  onMarkSigned?: () => void
}

export function ConstructionAgreement({ project, onBack, onMarkSigned }: ConstructionAgreementProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)

  const today = format(new Date(), 'dd/MM/yyyy')

  const getDocumentStyles = () => `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Times New Roman', Times, serif;
        background: white;
        padding: 20mm;
        font-size: 11pt;
        line-height: 1.5;
      }
      .agreement-document {
        background: white;
        max-width: 210mm;
        margin: 0 auto;
      }
      .a4-page {
        padding: 0;
      }
      .agreement-header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 2px solid #d1d5db;
      }
      h1 { color: #dc2626; font-size: 1.5rem; margin-bottom: 0.5rem; }
      h2 { color: #374151; font-size: 1.25rem; margin-bottom: 0.25rem; }
      h3 { color: #4b5563; font-size: 1rem; margin-bottom: 0.75rem; }
      .text-sm { font-size: 0.875rem; }
      .text-xs { font-size: 0.75rem; }
      .font-bold { font-weight: bold; }
      .font-semibold { font-weight: 600; }
      .font-medium { font-weight: 500; }
      .text-gray-600 { color: #4b5563; }
      .text-gray-700 { color: #374151; }
      .text-gray-800 { color: #1f2937; }
      .text-gray-900 { color: #111827; }
      .text-blue-600 { color: #2563eb; }
      .text-red-600 { color: #dc2626; }
      .mb-1 { margin-bottom: 0.25rem; }
      .mb-2 { margin-bottom: 0.5rem; }
      .mb-3 { margin-bottom: 0.75rem; }
      .mb-4 { margin-bottom: 1rem; }
      .mb-6 { margin-bottom: 1.5rem; }
      .mb-8 { margin-bottom: 2rem; }
      .mt-2 { margin-top: 0.5rem; }
      .mt-3 { margin-top: 0.75rem; }
      .mt-4 { margin-top: 1rem; }
      .mt-16 { margin-top: 4rem; }
      .ml-2 { margin-left: 0.5rem; }
      .ml-4 { margin-left: 1rem; }
      .mr-2 { margin-right: 0.5rem; }
      .p-3 { padding: 0.75rem; }
      .pt-2 { padding-top: 0.5rem; }
      .pt-4 { padding-top: 1rem; }
      .pt-8 { padding-top: 2rem; }
      .pb-2 { padding-bottom: 0.5rem; }
      .pb-6 { padding-bottom: 1.5rem; }
      .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
      .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
      .px-4 { padding-left: 1rem; padding-right: 1rem; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      .border-b { border-bottom: 1px solid #d1d5db; }
      .border-b-2 { border-bottom: 2px solid #d1d5db; }
      .border-t { border-top: 1px solid #d1d5db; }
      .border-t-2 { border-top: 2px solid #d1d5db; }
      .border-l-4 { border-left: 4px solid #dc2626; }
      .border-gray-200 { border-color: #e5e7eb; }
      .border-gray-300 { border-color: #d1d5db; }
      .border-gray-400 { border-color: #9ca3af; }
      .bg-red-50 { background-color: #fef2f2; }
      .bg-gray-50 { background-color: #f9fafb; }
      .bg-gray-100 { background-color: #f3f4f6; }
      .bg-white { background-color: white; }
      .grid { display: grid; }
      .grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
      .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
      .gap-4 { gap: 1rem; }
      .gap-8 { gap: 2rem; }
      .flex { display: flex; }
      .text-center { text-align: center; }
      .text-left { text-align: left; }
      .text-right { text-align: right; }
      .list-none { list-style: none; }
      .list-decimal { list-style-type: decimal; }
      .list-inside { list-style-position: inside; }
      .space-y-2 > * + * { margin-top: 0.5rem; }
      .italic { font-style: italic; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d1d5db; }
      .overflow-x-auto { overflow-x: auto; }
      @media print {
        body { padding: 0; margin: 0; }
        .page-break { page-break-inside: avoid; }
      }
      @page { size: A4; margin: 20mm; }
    </style>
  `

  const handlePrint = () => {
    if (!documentRef.current) return

    setIsPrinting(true)
    const printContent = documentRef.current.innerHTML
    const printWindow = window.open('', '_blank', 'width=800,height=600')

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Quotation - ${project.clientName}</title>
            ${getDocumentStyles()}
          </head>
          <body>
            <div class="agreement-document">
              ${printContent}
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()

      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        printWindow.close()
        setIsPrinting(false)
      }
    } else {
      setIsPrinting(false)
    }
  }

  const handleDownloadPDF = () => {
    if (!documentRef.current) return

    const printContent = documentRef.current.innerHTML
    const printWindow = window.open('', '_blank', 'width=800,height=600')

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Quotation - ${project.clientName}</title>
            ${getDocumentStyles()}
          </head>
          <body>
            <div class="agreement-document">
              ${printContent}
            </div>
            <script>
              // Auto-trigger print dialog for PDF save
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const getPackageSpecifications = () => {
    const specs = {
      basic: {
        basement: [
          'Basement level of building will be 3\'0" from the existing NGL.',
          'Car parking will be 1\'6" from NGL.',
          'RCC 1:1½:3 in Column, beams, Lintel and Roof slab with Zuari/Dalmia cement.',
          'M20 grade concrete for all structural elements.',
        ],
        brickwork: [
          'Red bricks of standard size for wall construction.',
          '9" thick walls for outer walls, 4.5" for inner walls.',
          'First class bricks with 1:6 cement mortar.',
        ],
        plastering: [
          'Internal: 12mm cement plastering with 1:4 mix.',
          'External: 15mm cement plastering with 1:4 mix.',
          'Smooth finish ready for painting.',
        ],
        flooring: [
          'Vitrified tiles @ ₹60/sq.ft for all rooms.',
          'Anti-skid tiles @ ₹40/sq.ft for staircases.',
          'Wall tiles up to 10\' height in toilets @ ₹45/sq.ft.',
        ],
        carpentry: [
          'Main door: Teak wood frame @ ₹20,000.',
          'Bedroom doors: Flush doors @ ₹4,500 each.',
          'Toilet doors: PVC doors @ ₹3,500 each.',
          'Basic UPVC windows.',
        ],
        electrical: [
          'Orbit/GM modular switches.',
          'Orbit wires (FR grade).',
          'Standard provisions as per electrical layout.',
        ],
        plumbing: [
          'Parryware/Hindware bathroom fittings @ ₹20,000/bathroom.',
          'CPVC pipes for water supply.',
          'PVC pipes for drainage.',
        ],
      },
      standard: {
        basement: [
          'Basement level of building will be 3\'0" from the existing NGL.',
          'Car parking will be 1\'6" from NGL.',
          'RCC 1:1½:3 in Column, beams, Lintel and Roof slab with Coromandel/Dalmia cement.',
          'M20 grade concrete with river sand for plastering.',
          'Enhanced concrete mix with better quality materials.',
        ],
        brickwork: [
          'First class red bricks for all walls.',
          '9" thick walls for outer walls, 4.5" for inner walls.',
          'Premium quality cement mortar 1:6 mix.',
        ],
        plastering: [
          'Internal: 12mm cement plastering with river sand.',
          'External: 15mm cement plastering with weather-resistant mix.',
          'Premium smooth finish.',
        ],
        flooring: [
          'Vitrified tiles @ ₹70/sq.ft for all rooms.',
          'Anti-skid tiles @ ₹50/sq.ft for staircases.',
          'Wall tiles up to 10\' height in toilets @ ₹55/sq.ft.',
          'Designer tiles for living areas.',
        ],
        carpentry: [
          'Main door: Teak wood frame @ ₹30,000 with designer finish.',
          'Bedroom doors: Flush doors @ ₹9,000 each.',
          'Toilet doors: WPVC doors @ ₹8,000 each.',
          'UPVC openable windows.',
        ],
        electrical: [
          'Anchor Roma modular switches.',
          'Finolex wires (FR grade).',
          'Enhanced provisions as per electrical layout.',
        ],
        plumbing: [
          'Parryware Indus bathroom fittings @ ₹30,000/bathroom.',
          'Wall-mounted commode.',
          'Premium CPVC pipes for water supply.',
        ],
      },
      premium: {
        basement: [
          'Basement level of building will be 3\'0" from the existing NGL.',
          'Car parking will be 1\'6" from NGL.',
          'RCC 1:1½:3 in Column, beams, Lintel and Roof slab with Ultratech/Coromandel cement.',
          'M25 grade concrete with Fe550D TMT bars (I Steel).',
          'Anti-termite treatment included.',
          'Fosroc waterproofing for basement and terrace.',
        ],
        brickwork: [
          'Premium quality red bricks.',
          '9" thick walls for outer walls with enhanced insulation.',
          'High-strength cement mortar.',
        ],
        plastering: [
          'Internal: Premium 12mm cement plastering with river sand.',
          'External: Weather-resistant plastering with waterproofing additive.',
          'Ultra-smooth finish for premium paint.',
        ],
        flooring: [
          'Premium vitrified tiles @ ₹65/sq.ft + Granite option.',
          'Granite staircase flooring @ ₹150/sq.ft.',
          'Wall tiles up to ceiling in toilets with anti-skid.',
          'G20/Black Granite kitchen counter.',
        ],
        carpentry: [
          'Main door: Teak wood @ ₹35,000 with brass fittings.',
          'Bedroom doors: Flush doors @ ₹10,000 with 2nd class teak frame.',
          'Toilet doors: WPVC doors @ ₹8,000 each.',
          'UPVC Venesta/Etti windows @ ₹600/sq.ft.',
        ],
        electrical: [
          'Legrand modular switches (Premium range).',
          'Finolex wires (FR grade, premium).',
          'Complete provisions with smart home ready wiring.',
        ],
        plumbing: [
          'Jaguar bathroom fittings @ ₹40,000/bathroom.',
          'Designer sanitary ware.',
          'Premium CPVC pipes throughout.',
        ],
      },
    }

    return specs[project.packageType] || specs.standard
  }

  const specifications = getPackageSpecifications()

  const getBrandTable = () => {
    const brands = {
      basic: [
        { item: 'Cement', brand: 'Zuari/Dalmia' },
        { item: 'Steel', brand: 'Kamachi' },
        { item: 'Tiles', brand: 'KAG' },
        { item: 'Electrical Switches', brand: 'Orbit/GM' },
        { item: 'Wires', brand: 'Orbit' },
        { item: 'Bathroom Fittings', brand: 'Parryware/Hindware' },
        { item: 'Pipes', brand: 'CPVC/PVC Standard' },
        { item: 'Paint', brand: 'Asian Paints/Berger' },
      ],
      standard: [
        { item: 'Cement', brand: 'Coromandel/Dalmia' },
        { item: 'Steel', brand: 'ARS/ARUN' },
        { item: 'Tiles', brand: 'KAG/Anuj' },
        { item: 'Electrical Switches', brand: 'Anchor Roma' },
        { item: 'Wires', brand: 'Finolex' },
        { item: 'Bathroom Fittings', brand: 'Parryware Indus' },
        { item: 'Pipes', brand: 'Premium CPVC' },
        { item: 'Paint', brand: 'Asian Paints Royale' },
      ],
      premium: [
        { item: 'Cement', brand: 'Ultratech/Coromandel' },
        { item: 'Steel', brand: 'Fe550D I Steel' },
        { item: 'Tiles', brand: 'Premium Brands' },
        { item: 'Electrical Switches', brand: 'Legrand' },
        { item: 'Wires', brand: 'Finolex Premium' },
        { item: 'Bathroom Fittings', brand: 'Jaguar' },
        { item: 'Pipes', brand: 'Premium CPVC' },
        { item: 'Paint', brand: 'Asian Paints Royale/Dulux' },
        { item: 'Waterproofing', brand: 'Fosroc' },
      ],
    }

    return brands[project.packageType] || brands.standard
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className={`${isPrinting ? 'hidden' : 'mb-6 flex flex-wrap gap-3'} print:hidden`}>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2" />
          Edit Quotation
        </Button>
        <Button onClick={handleDownloadPDF} className="bg-red-600 hover:bg-red-700">
          <Download className="mr-2" />
          Download as PDF
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2" />
          Print
        </Button>
        {onMarkSigned && (
          <Button onClick={onMarkSigned} className="bg-green-600 hover:bg-green-700 ml-auto">
            <CheckCircle className="mr-2" />
            Mark as Signed & Create Project
          </Button>
        )}
      </div>

      <Card className="agreement-document bg-white shadow-lg print:shadow-none">
        <div ref={documentRef} className="a4-page p-8 md:p-12 print:p-12">
          <div className="agreement-header text-center mb-8 pb-6 border-b-2 border-gray-300">
            <h1 className="text-2xl md:text-3xl font-bold text-red-600 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              ELANJAI BUILDOS
            </h1>
            <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-1">
              CIVIL ENGINEERING CONTRACTOR
            </h2>
            <h3 className="text-base md:text-lg font-medium text-gray-600 mb-3">
              Er. P. Sathish Kumar
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              Cell: <span className="font-medium">9677265045</span>
            </p>
            <p className="text-sm text-gray-600 mb-1">
              No.19, Pillayar Kovil Street, Old Pallavaram, Chennai – 600117
            </p>
            <p className="text-sm text-gray-600">
              Email: <span className="text-blue-600">elanjaibuildos@gmail.com</span> |
              Web: <span className="text-blue-600">www.elanjaibuildos.com</span>
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700">
                DATE: <span className="font-normal">{today}</span>
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              PROJECT DETAILS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Client Name:</span>
                <span className="ml-2 text-gray-900">{project.clientName}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Project Description:</span>
                <span className="ml-2 text-gray-900">{project.name}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold text-gray-700">Site Location:</span>
                <span className="ml-2 text-gray-900">{project.location}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Built-Up Area:</span>
                <span className="ml-2 text-gray-900">{project.squareFootage.toLocaleString('en-IN')} sq.ft</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Rate:</span>
                <span className="ml-2 text-gray-900">
                  Rs. {(project.totalCost / project.squareFootage).toLocaleString('en-IN', { maximumFractionDigits: 0 })} / sq.ft
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold text-gray-700">Measurement Basis:</span>
                <span className="ml-2 text-gray-900">Outer to Outer roof area</span>
              </div>
              <div className="md:col-span-2 mt-2 p-3 bg-red-50 border-l-4 border-red-600">
                <span className="font-bold text-gray-800">Total Contract Value:</span>
                <span className="ml-2 text-xl font-bold text-red-600">
                  Rs. {project.totalCost.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="page-break mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              DETAILED SPECIFICATIONS
            </h3>

            <div className="mb-6">
              <h4 className="text-base font-bold text-gray-800 mb-3">1. Basement & Concrete Works</h4>
              <ul className="list-none space-y-2 ml-4 text-sm text-gray-700">
                {specifications.basement.map((spec, idx) => (
                  <li key={idx} className="flex">
                    <span className="mr-2">{String.fromCharCode(97 + idx)})</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-bold text-gray-800 mb-3">2. Brick Layer Works</h4>
              <ul className="list-none space-y-2 ml-4 text-sm text-gray-700">
                {specifications.brickwork.map((spec, idx) => (
                  <li key={idx} className="flex">
                    <span className="mr-2">{String.fromCharCode(97 + idx)})</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-bold text-gray-800 mb-3">3. Plastering Works</h4>
              <ul className="list-none space-y-2 ml-4 text-sm text-gray-700">
                {specifications.plastering.map((spec, idx) => (
                  <li key={idx} className="flex">
                    <span className="mr-2">{String.fromCharCode(97 + idx)})</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-bold text-gray-800 mb-3">4. Flooring & Tiles</h4>
              <ul className="list-none space-y-2 ml-4 text-sm text-gray-700">
                {specifications.flooring.map((spec, idx) => (
                  <li key={idx} className="flex">
                    <span className="mr-2">{String.fromCharCode(97 + idx)})</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-bold text-gray-800 mb-3">5. Carpentry & Joinery</h4>
              <ul className="list-none space-y-2 ml-4 text-sm text-gray-700">
                {specifications.carpentry.map((spec, idx) => (
                  <li key={idx} className="flex">
                    <span className="mr-2">{String.fromCharCode(97 + idx)})</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-bold text-gray-800 mb-3">6. Electrical Works</h4>
              <ul className="list-none space-y-2 ml-4 text-sm text-gray-700">
                {specifications.electrical.map((spec, idx) => (
                  <li key={idx} className="flex">
                    <span className="mr-2">{String.fromCharCode(97 + idx)})</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-base font-bold text-gray-800 mb-3">7. Plumbing & Sanitary Works</h4>
              <ul className="list-none space-y-2 ml-4 text-sm text-gray-700">
                {specifications.plumbing.map((spec, idx) => (
                  <li key={idx} className="flex">
                    <span className="mr-2">{String.fromCharCode(97 + idx)})</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="page-break mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              ELECTRICAL PROVISIONS
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              The following electrical provisions will be installed as per standard requirements:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 md:px-3 py-2 text-left font-semibold">Room</th>
                    <th className="border border-gray-300 px-2 md:px-3 py-2 text-center font-semibold">Lights</th>
                    <th className="border border-gray-300 px-2 md:px-3 py-2 text-center font-semibold">Fans</th>
                    <th className="border border-gray-300 px-2 md:px-3 py-2 text-center font-semibold">5A Sockets</th>
                    <th className="border border-gray-300 px-2 md:px-3 py-2 text-center font-semibold">AC/TV</th>
                    <th className="border border-gray-300 px-2 md:px-3 py-2 text-left font-semibold">Other</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border border-gray-300 px-2 md:px-3 py-2">Hall</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">4</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">2</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">5</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">AC, Spotlights</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2">Ceiling spots: 4</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-2 md:px-3 py-2">Kitchen</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">2</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">1</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">4 (1×5A, 3×15A)</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">-</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2">Exhaust provision</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border border-gray-300 px-2 md:px-3 py-2">Bedrooms (each)</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">2</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">1</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">2</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">AC, TV</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2">Two-way switch, Foot lamp</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-2 md:px-3 py-2">Toilets (each)</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">1</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">-</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">1</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">-</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2">Exhaust, Geyser</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border border-gray-300 px-2 md:px-3 py-2">Parking</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">2</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">-</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">1 (15A)</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2 text-center">-</td>
                    <td className="border border-gray-300 px-2 md:px-3 py-2">Compound light, EV socket</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-600 mt-3 italic">
              * Inverter wiring included for lights and fans in all rooms
            </p>
          </div>

          <div className="page-break mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              BRAND NAMES
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Item</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Brand</th>
                  </tr>
                </thead>
                <tbody>
                  {getBrandTable().map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-4 py-2">{item.item}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.brand}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="page-break mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              PAYMENT SCHEDULE
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Stage</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Work Description</th>
                    <th className="border border-gray-300 px-3 py-2 text-right font-semibold">% of Cost</th>
                    <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {project.stages.map((stage, idx) => (
                    <tr key={stage.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-3 py-2 text-center">{idx + 1}</td>
                      <td className="border border-gray-300 px-3 py-2">{stage.name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">{stage.percentage}%</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        {stage.budgetAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-red-50 font-bold">
                    <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right">TOTAL</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">100%</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      ₹ {project.totalCost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-600 mt-3 italic">
              Payment due upon completion of each stage as inspected and verified.
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300">
              TERMS & CONDITIONS
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>All work will be executed as per the specifications mentioned above and approved drawings.</li>
              <li>Payment shall be made as per the payment schedule mentioned above.</li>
              <li>Any additional work beyond the scope mentioned will be charged extra as per mutual agreement.</li>
              <li>The contractor shall not be responsible for delays due to force majeure conditions.</li>
              <li>All government approvals and permissions shall be obtained by the client.</li>
              <li>Site shall be made available for work with basic facilities like water and electricity.</li>
              <li>Any change in material specifications requires written approval from both parties.</li>
              <li>Warranty period: 1 year from the date of handover for structural defects.</li>
              <li>Dispute resolution shall be through mutual discussion and arbitration if needed.</li>
              <li>This agreement is valid for 30 days from the date mentioned above.</li>
            </ol>
          </div>

          <div className="page-break mt-16 pt-8 border-t-2 border-gray-300">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 mb-16">For ELANJAI BUILDOS</p>
                <div className="border-t border-gray-400 pt-2">
                  <p className="text-sm font-semibold">Er. P. Sathish Kumar</p>
                  <p className="text-xs text-gray-600 mt-1">Proprietor</p>
                  <p className="text-xs text-gray-600 mt-3">Date: ______________</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 mb-16">Client Signature</p>
                <div className="border-t border-gray-400 pt-2">
                  <p className="text-sm font-semibold">{project.clientName}</p>
                  <p className="text-xs text-gray-600 mt-1">Client</p>
                  <p className="text-xs text-gray-600 mt-3">Date: ______________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <style>{`
        @media print {
          body {
            background: white;
            margin: 0;
            padding: 0;
          }

          .agreement-document {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }

          .a4-page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: 20mm !important;
            background: white;
            font-size: 11pt;
            line-height: 1.5;
            font-family: 'Times New Roman', Times, serif;
          }

          .page-break {
            page-break-inside: avoid;
          }

          h1, h2, h3, h4 {
            page-break-after: avoid;
          }

          table {
            page-break-inside: avoid;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }

          .print\\:p-12 {
            padding: 20mm !important;
          }
        }

        @page {
          size: A4;
          margin: 0;
        }
      `}</style>
    </div>
  )
}
